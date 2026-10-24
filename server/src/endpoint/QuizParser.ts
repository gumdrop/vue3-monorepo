import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs'
import type { QuizPaper, QuizQuestion, QuizRound } from '@quizleague/shared'
import { markUnderlinesInItem, underlineRectsForPage } from './QuizUnderline'
import { HttpError } from './util'

interface PositionedItem {
  str: string
  x: number
  y: number
}

const HEADER_PREFIX = /^(ROUND|SPARES|TWENTY|BEER|TIEBREAK)/i
const INDIVIDUAL_MARKER = /INDIVIDUAL|PICK A SUBJECT/i

const stripMarkers = (text: string) => text.replace(/<\/?u>/g, '')

const isNumber = (text: string) => /^\d/.test(stripMarkers(text))

// Column x-boundaries for the Word table layout (number | question | answer),
// expressed as the left edge of each column in PDF points.
const NUMBER_COLUMN_MAX_X = 50
const ANSWER_COLUMN_MIN_X = 420

type Column = 'number' | 'question' | 'answer'

export const columnFor = (x: number): Column =>
  x < NUMBER_COLUMN_MAX_X ? 'number' : x < ANSWER_COLUMN_MIN_X ? 'question' : 'answer'

function layoutDrift(): HttpError {
  return new HttpError(
    502,
    'Quiz template changed — could not recognise the question paper layout',
    'Bad Gateway',
  )
}

// Rejects items whose x-positions do not match the assumed template before
// parseRounds can silently produce a mangled paper (ADR-005 drift guard).
export function assertColumnLayout(items: PositionedItem[]): void {
  const columns = new Set<Column>()
  let numbered = false

  for (const item of items) {
    const column = columnFor(item.x)
    columns.add(column)
    if (column === 'number' && isNumber(item.str)) numbered = true
  }

  if (!columns.has('number') || !columns.has('question') || !columns.has('answer') || !numbered) {
    throw layoutDrift()
  }
}

// Rejects parsed papers that are implausible for this template: no rounds, an
// empty round name, no numbered questions, or a majority of numbered questions
// missing their question/answer text (all signs the column boundaries drifted).
export function assertParsedPaper(paper: QuizPaper): void {
  if (paper.rounds.length === 0) throw layoutDrift()

  let numberedQuestions = 0
  let malformedQuestions = 0

  for (const round of paper.rounds) {
    if (!round.round.trim()) throw layoutDrift()
    for (const question of round.questions) {
      if (!question.number.trim()) continue
      numberedQuestions += 1
      if (!question.question.trim() || !question.answer.trim()) malformedQuestions += 1
    }
  }

  if (numberedQuestions === 0) throw layoutDrift()
  if (malformedQuestions > numberedQuestions / 2) throw layoutDrift()
}

// Decrypts the PDF and deterministically reconstructs the quiz structure from
// the Word-generated table layout (number | question | answer columns).
export async function parseQuizPaper(pdfBytes: Uint8Array, password: string): Promise<QuizPaper> {
  let doc
  try {
    doc = await getDocument({ data: pdfBytes, password, verbosity: 0 }).promise
  } catch (error) {
    const name = (error as { name?: string })?.name
    if (name === 'PasswordException') {
      throw new HttpError(400, 'Incorrect password', 'Bad Request')
    }
    throw new HttpError(502, 'Quiz parsing failed', 'Bad Gateway')
  }

  const items: PositionedItem[] = []
  for (let pageNumber = 1; pageNumber <= doc.numPages; pageNumber++) {
    const page = await doc.getPage(pageNumber)
    const textContent = await page.getTextContent()
    const underlines = await underlineRectsForPage(page)

    for (const item of textContent.items) {
      if (!('str' in item) || !item.str.trim()) continue
      items.push({
        str: markUnderlinesInItem(item, underlines),
        x: item.transform[4],
        y: item.transform[5],
      })
    }
  }

  assertColumnLayout(items)
  const paper = { rounds: parseRounds(items) }
  assertParsedPaper(paper)
  return paper
}

function parseRounds(items: PositionedItem[]): QuizRound[] {
  const rounds: QuizRound[] = []
  let round: QuizRound | null = null
  let question: QuizQuestion | null = null
  let inHeader = false
  let headerY = 0
  let collectingSubjects = false

  for (const item of items) {
    const column = columnFor(item.x)

    if (column === 'number' && HEADER_PREFIX.test(stripMarkers(item.str))) {
      const isTiebreak = /^TIEBREAK/i.test(stripMarkers(item.str))
      round = { round: stripMarkers(item.str), questions: [] }
      rounds.push(round)
      question = null
      collectingSubjects = false
      inHeader = !isTiebreak
      headerY = item.y
      continue
    }

    if (!round) continue

    if (inHeader) {
      if (Math.abs(item.y - headerY) <= 1.5) {
        round.round += ' ' + stripMarkers(item.str)
        continue
      }
      inHeader = false
      collectingSubjects = INDIVIDUAL_MARKER.test(round.round)
    }

    if (column === 'number' && isNumber(item.str)) {
      question = { number: stripMarkers(item.str), question: '', answer: '' }
      round.questions.push(question)
      collectingSubjects = false
      continue
    }

    if (collectingSubjects) {
      if (!round.subjects) round.subjects = []
      round.subjects.push(stripMarkers(item.str))
      continue
    }

    if (column === 'question' || column === 'answer') {
      if (!question) {
        question = { number: '', question: '', answer: '' }
        round.questions.push(question)
      }
      if (column === 'question') {
        question.question += (question.question ? ' ' : '') + item.str
      } else {
        question.answer += (question.answer ? ' ' : '') + item.str
      }
    }
  }

  return rounds.map((round) => ({
    round: round.round,
    subjects: round.subjects,
    questions: round.questions.map((question) => ({
      number: question.number,
      question: normalizeText(question.question),
      answer: normalizeText(question.answer),
    })),
  }))
}

function normalizeText(text: string): string {
  return text
    .replace(/\s+([,.!?;:)])/g, '$1')
    .replace(/\s+’/g, '’')
    .replace(/\s+/g, ' ')
    .trim()
}
