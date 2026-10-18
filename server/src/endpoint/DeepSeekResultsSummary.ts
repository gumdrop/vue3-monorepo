import { existsSync, readFileSync } from 'node:fs'
import Path from 'node:path'
import type { QuizPaper, QuizReportCommand } from '@quizleague/shared'

export interface FixtureSetSummaryFixture {
  homeTeam: string
  awayTeam: string
  homeScore: number
  awayScore: number
  reports: string[]
}

export interface FixtureSetSummaryInput {
  competitionName: string
  fixtureSetDescription: string
  fixtureSetDate: string
  fixtures: FixtureSetSummaryFixture[]
}

export interface FixtureSetSummary {
  text: string
  model: string
}

export interface CompetitionRoundupFixtureResult {
  homeTeam: string
  awayTeam: string
  homeScore: number
  awayScore: number
}

export interface CompetitionRoundupFixtureSet {
  fixtureSetDescription: string
  fixtureSetDate: string
  summary?: string
  fixtures: CompetitionRoundupFixtureResult[]
}

export interface CompetitionRoundupTableSnapshot {
  fixtureSetDescription: string
  fixtureSetDate: string
  tables: Array<{
    description?: string
    rows: Array<{
      team: string
      played: number
      won: number
      drawn: number
      lost: number
      matchPointsFor: number
      matchPointsAgainst: number
      leaguePoints: number
      position: string
    }>
  }>
}

export interface CompetitionRoundupInput {
  competitionName: string
  fixtureSets: CompetitionRoundupFixtureSet[]
  statistics?: {
    averageScore: number
    averageWinningScore: number
    averageLosingScore: number
    tableSnapshots: CompetitionRoundupTableSnapshot[]
  }
}

interface DeepSeekChatCompletionResponse {
  choices?: Array<{
    message?: {
      content?: string
    }
    finish_reason?: string
  }>
}

const deepseekModel = () => process.env['DEEPSEEK_MODEL'] ?? 'deepseek-chat'

const deepseekApiKey = () => {
  const apiKey = process.env['DEEPSEEK_API_KEY']?.trim()
  if (apiKey) return apiKey

  const candidatePaths = [
    Path.join(process.cwd(), 'deepseek-api-key.txt'),
    Path.join(process.cwd(), '..', 'deepseek-api-key.txt'),
  ]
  const apiKeyPath = candidatePaths.find((path) => existsSync(path))
  return apiKeyPath ? readFileSync(apiKeyPath, 'utf8').trim() : undefined
}

const fixtureLine = (fixture: FixtureSetSummaryFixture) => {
  const reports =
    fixture.reports.length > 0
      ? fixture.reports.map((report) => `    Report: ${report}`).join('\n')
      : '    Report: none submitted'

  return `- ${fixture.homeTeam} ${fixture.homeScore}-${fixture.awayScore} ${fixture.awayTeam}\n${reports}`
}

const buildPrompt = (
  input: FixtureSetSummaryInput,
) => `You write concise public homepage copy for the Chiltern Quiz League.

Summarise this completed fixture set using only the results and reports below.
Mention notable scores or report details where useful.
Keep it under 120 words.
Produce Markdown.
Return only Markdown body text, with no heading.
Do not return JSON, HTML, or a fenced code block.

Competition: ${input.competitionName}
Fixture set: ${input.fixtureSetDescription}
Date: ${input.fixtureSetDate}

Results and reports:
${input.fixtures.map(fixtureLine).join('\n')}`

const resultLine = (fixture: CompetitionRoundupFixtureResult) =>
  `    - ${fixture.homeTeam} ${fixture.homeScore}-${fixture.awayScore} ${fixture.awayTeam}`

const fixtureSetRoundupLine = (fixtureSet: CompetitionRoundupFixtureSet) => {
  const summary = fixtureSet.summary?.trim()
    ? `  Fixture-set summary: ${fixtureSet.summary.trim()}`
    : '  Fixture-set summary: none available'

  return `- ${fixtureSet.fixtureSetDate}: ${fixtureSet.fixtureSetDescription}
${summary}
  Results:
${fixtureSet.fixtures.map(resultLine).join('\n')}`
}

const buildCompetitionRoundupPrompt = (input: CompetitionRoundupInput) => {
  const stats = input.statistics
    ? `
Season statistics:
- Average score: ${input.statistics.averageScore.toFixed(2)}
- Average winning score: ${input.statistics.averageWinningScore.toFixed(2)}
- Average losing score: ${input.statistics.averageLosingScore.toFixed(2)}

League table snapshots (showing progression):
${input.statistics.tableSnapshots
  .map(
    (s) => `  - ${s.fixtureSetDate}: ${s.fixtureSetDescription}
${s.tables
  .map(
    (t) => `    ${t.description ?? 'Table'}:
${t.rows
  .map(
    (r) =>
      `      ${r.position}. ${r.team} P:${r.played} W:${r.won} D:${r.drawn} L:${r.lost} F:${r.matchPointsFor} A:${r.matchPointsAgainst} Pts:${r.leaguePoints}`,
  )
  .join('\n')}`,
  )
  .join('\n')}`,
  )
  .join('\n')}`
    : ''

  return `You write concise public season roundup copy for the Chiltern Quiz League.

Summarise this completed team competition using only the fixture-set summaries, results, and league table progression below.
Mention the main story of the competition, notable runs, close matches, or decisive results where useful.
Use the league table snapshots to describe how the title race or positions changed over time.
Do not list every result.
Keep it under 250 words.
Produce Markdown.
Return only Markdown body text, with no heading.
Do not return JSON, HTML, or a fenced code block.

Competition: ${input.competitionName}
${stats}

Completed fixture sets:
${input.fixtureSets.map(fixtureSetRoundupLine).join('\n')}`
}

export async function generateFixtureSetResultsSummary(
  input: FixtureSetSummaryInput,
): Promise<FixtureSetSummary | undefined> {
  return generateDeepSeekSummary(buildPrompt(input), {
    failureLabel: 'fixture set summary',
    skipLabel: 'fixture set results summary',
  })
}

export async function generateCompetitionRoundup(
  input: CompetitionRoundupInput,
): Promise<FixtureSetSummary | undefined> {
  return generateDeepSeekSummary(buildCompetitionRoundupPrompt(input), {
    failureLabel: 'competition roundup',
    skipLabel: 'competition roundup',
  })
}

async function generateDeepSeekSummary(
  prompt: string,
  labels: { failureLabel: string; skipLabel: string },
): Promise<FixtureSetSummary | undefined> {
  const apiKey = deepseekApiKey()
  if (!apiKey) {
    console.warn(`Skipping ${labels.skipLabel}: DEEPSEEK_API_KEY is not configured`)
    return undefined
  }

  const model = deepseekModel()
  const response = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 8192,
      stream: false,
    }),
  })

  if (!response.ok) {
    const body = await response.text()
    console.error(`DeepSeek ${labels.failureLabel} failed: ${response.status} ${body}`)
    return undefined
  }

  const data = (await response.json()) as DeepSeekChatCompletionResponse
  const choice = data.choices?.[0]
  if (choice?.finish_reason === 'length') {
    throw new Error(`DeepSeek ${labels.failureLabel} was truncated by max_tokens`)
  }

  const text = choice?.message?.content?.trim()
  return text ? { text, model } : undefined
}

const buildQuizParsePrompt = (text: string) => `Extract all quiz questions and answers from the quiz text below and return them as JSON.

Use this exact nested structure:
{
  "rounds": [
    {
      "round": "Round Name",
      "subjects": ["Subject 1", "Subject 2"],
      "questions": [
        {
          "number": "1A",
          "question": "...",
          "answer": "..."
        }
      ]
    }
  ]
}

Rules:
- Preserve round names exactly as printed.
- If a round name contains the word "Individual", add a "subjects" array listing the subject headings in the order they appear in the document. Do not add "subjects" to other rounds.
- Preserve question numbers exactly (e.g. 1A, 1B, 2A; some sections may use 1, 2, 3; tiebreak may have an empty number).
- Copy question and answer text verbatim, including punctuation, accents, special characters, and parenthetical pronunciations or notes.
- Underlined words are wrapped in <u> and </u> markers. Preserve these markers exactly in question and answer text. Do not include them in round names or subjects — keep round names and subjects as plain text without <u> markers.
- Include every section: main rounds, spares, beer round, tiebreak, etc.
- Output only valid JSON. Do not include markdown, commentary, or extra text.

Quiz text:
"""
${text}
"""`

function stripUnderlineMarkers(value: string): string {
  return value.replace(/<\/?u>/g, '')
}

function validateQuizPaper(value: unknown): QuizPaper {
  if (typeof value !== 'object' || value === null) {
    throw new Error('Quiz parse response is not a JSON object')
  }
  const paper = value as { rounds?: unknown }
  if (!Array.isArray(paper.rounds)) {
    throw new Error('Quiz parse response is missing a rounds array')
  }

  for (const round of paper.rounds) {
    const r = round as { round?: unknown; subjects?: unknown; questions?: unknown }
    if (typeof r?.round !== 'string') throw new Error('Quiz round is missing a name')
    r.round = stripUnderlineMarkers(r.round)
    if (r.subjects !== undefined && !Array.isArray(r.subjects)) {
      throw new Error('Quiz round subjects must be an array')
    }
    if (Array.isArray(r.subjects)) {
      r.subjects = r.subjects.map((subject) =>
        typeof subject === 'string' ? stripUnderlineMarkers(subject) : subject,
      )
    }
    if (!Array.isArray(r.questions)) throw new Error('Quiz round is missing questions')

    for (const question of r.questions) {
      const q = question as { number?: unknown; question?: unknown; answer?: unknown }
      if (typeof q?.number !== 'string') throw new Error('Quiz question is missing a number')
      if (typeof q?.question !== 'string') throw new Error('Quiz question is missing text')
      if (typeof q?.answer !== 'string') throw new Error('Quiz question is missing an answer')
    }
  }

  return paper as QuizPaper
}

export async function parseQuiz(text: string): Promise<QuizPaper> {
  const apiKey = deepseekApiKey()
  if (!apiKey) throw new Error('DEEPSEEK_API_KEY is not configured')

  const model = deepseekModel()
  const response = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: buildQuizParsePrompt(text) }],
      temperature: 0.1,
      max_tokens: 8192,
      stream: false,
      response_format: { type: 'json_object' },
    }),
  })

  if (!response.ok) {
    const body = await response.text()
    console.error(`DeepSeek quiz parse failed: ${response.status} ${body}`)
    throw new Error('Quiz parse failed')
  }

  const data = (await response.json()) as DeepSeekChatCompletionResponse
  const choice = data.choices?.[0]
  if (choice?.finish_reason === 'length') {
    throw new Error('DeepSeek quiz parse was truncated by max_tokens')
  }

  const content = choice?.message?.content?.trim()
  if (!content) throw new Error('Quiz parse returned no content')

  let parsed: unknown
  try {
    parsed = JSON.parse(content)
  } catch {
    throw new Error('Quiz parse did not return valid JSON')
  }

  return validateQuizPaper(parsed)
}

const matchReportQuestionLine = (q: QuizReportCommand['rounds'][number]['questions'][number]) => {
  const contestant = q.contestant ? ` — asked to ${q.contestant}` : ''
  const category = q.category ? ` [${q.category}]` : ''
  const joker = q.joker ? ` (joker for ${q.joker})` : ''
  return `    ${q.number}: ${q.outcome}${category}${joker}${contestant}`
}

const buildMatchReportPrompt = (input: QuizReportCommand) => {
  const rounds = input.rounds
    .map(
      (round) =>
        `- ${round.name}\n${round.questions.map(matchReportQuestionLine).join('\n')}`,
    )
    .join('\n')

  return `You write a match report for the Chiltern Quiz League.

Write a concise, engaging Markdown report of this match using only the recorded data below.
Mention the final score, notable correct answers and bonus conversions, individual-round performances, and joker categories.

Outcome meanings (recorded per question):
- "correct": the side asked answered correctly (2 points to them).
- "bonus": the side asked got it wrong and the opposition answered correctly (1 point to the opposition).
- "unanswered": neither side answered correctly.

A "(joker for home/away/both)" marker on a category only means that category carried doubled points for that side — it is not itself an outcome. Do not describe a joker category as "converted" or "decisive" unless the recorded outcome actually shows a "bonus".

Describe the match strictly from the recorded outcomes. Do not invent drama: if every question in a round was answered "correct" by the side asked, say so plainly rather than calling the round decisive or a clean sweep. Only describe a round or category as decisive when the outcomes actually show bonus conversions or wrong answers.

The beer round is a separate leg and does NOT count towards the main quiz result — do not treat it as part of the match score. Include the beer leg result at the end of the report as a short, separate note.

Keep it under 300 words.
Return only Markdown body text, with no heading.
Do not return JSON, HTML, or a fenced code block.

${input.homeTeam} vs ${input.awayTeam}
Final score (main quiz): ${input.homeTeam} ${input.homeScore}-${input.awayScore} ${input.awayTeam}
Beer leg (separate, does not count): ${input.homeTeam} ${input.beerRoundHomeScore}-${input.beerRoundAwayScore} ${input.awayTeam}

Rounds:
${rounds}`
}

export async function generateMatchReport(
  input: QuizReportCommand,
): Promise<FixtureSetSummary | undefined> {
  return generateDeepSeekSummary(buildMatchReportPrompt(input), {
    failureLabel: 'match report',
    skipLabel: 'match report',
  })
}
