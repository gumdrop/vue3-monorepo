import type { QuizAcquireCommand, QuizPaper } from '@quizleague/shared'
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs'
import { parseQuiz } from './DeepSeekResultsSummary'
import { HttpError } from './util'

const WIX_HOME = 'https://pantscat69er.wixsite.com/chiltern'

export async function acquireQuiz(command: QuizAcquireCommand): Promise<QuizPaper> {
  const pdfUrl = await resolveQuizPdfUrl(command.fixtureDate)
  const pdfBytes = await downloadPdf(pdfUrl)
  const text = await decryptQuizText(pdfBytes, command.password)
  return parseQuiz(text)
}

export async function resolveQuizPdfUrl(fixtureDate: string): Promise<string> {
  const homeHtml = await fetchText(WIX_HOME, 'Quiz not found for this date')
  const link = findQuizLink(homeHtml, fixtureDate)
  if (!link) throw new HttpError(404, 'Quiz not found for this date', 'Not Found')

  const subpageHtml = await fetchText(link, 'Quiz not found for this date')
  const pdfUrl = findPdfUrl(subpageHtml)
  if (!pdfUrl) throw new HttpError(404, 'Quiz PDF not found for this date', 'Not Found')

  return validatePdfUrl(pdfUrl)
}

export async function decryptQuizText(pdfBytes: Uint8Array, password: string): Promise<string> {
  let doc
  try {
    doc = await getDocument({ data: pdfBytes, password, verbosity: 0 }).promise
  } catch (error) {
    const name = (error as { name?: string })?.name
    if (name === 'PasswordException') {
      throw new HttpError(400, 'Incorrect password', 'Bad Request')
    }
    throw new HttpError(502, 'Quiz decryption failed', 'Bad Gateway')
  }

  const pages: string[] = []
  for (let pageNumber = 1; pageNumber <= doc.numPages; pageNumber++) {
    const page = await doc.getPage(pageNumber)
    const content = await page.getTextContent()
    pages.push(content.items.map((item) => ('str' in item ? item.str : '')).join('\n'))
  }

  return pages.join('\n\n')
}

async function downloadPdf(pdfUrl: string): Promise<Uint8Array> {
  let response: Response
  try {
    response = await fetch(pdfUrl)
  } catch {
    throw new HttpError(502, 'Quiz download failed', 'Bad Gateway')
  }

  if (!response.ok) {
    throw new HttpError(502, 'Quiz download failed', 'Bad Gateway')
  }

  const buffer = await response.arrayBuffer()
  return new Uint8Array(buffer)
}

async function fetchText(url: string, notFoundMessage: string): Promise<string> {
  let response: Response
  try {
    response = await fetch(url)
  } catch {
    throw new HttpError(502, 'Quiz download failed', 'Bad Gateway')
  }

  if (!response.ok) {
    const code = response.status === 404 ? 404 : 502
    throw new HttpError(code, notFoundMessage, code === 404 ? 'Not Found' : 'Bad Gateway')
  }

  return response.text()
}

function dateVariants(fixtureDate: string): string[] {
  const [year, month, day] = fixtureDate.split('-')
  if (!year || !month || !day) return [fixtureDate]
  return [`${day}/${month}/${year.slice(-2)}`, `${day}/${month}/${year}`]
}

function stripTags(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

function findQuizLink(homeHtml: string, fixtureDate: string): string | undefined {
  const variants = dateVariants(fixtureDate)
  const anchorRegex =
    /<a\b[^>]*href="(https:\/\/pantscat69er\.wixsite\.com\/chiltern\/[^"]+)"[^>]*>([\s\S]*?)<\/a>/gi

  let match: RegExpExecArray | null
  while ((match = anchorRegex.exec(homeHtml))) {
    const text = stripTags(match[2])
    if (text.includes('Quiz for') && variants.some((variant) => text.includes(variant))) {
      return match[1]
    }
  }

  return undefined
}

function findPdfUrl(html: string): string | undefined {
  return html.match(/https:\/\/[a-z0-9-]+\.filesusr\.com\/ugd\/[a-zA-Z0-9_]+\.[pP][dD][fF]/)?.[0]
}

function validatePdfUrl(raw: string): string {
  const url = new URL(raw)
  if (!url.hostname.endsWith('filesusr.com')) {
    throw new HttpError(502, 'Unexpected quiz PDF host', 'Bad Gateway')
  }
  if (!url.pathname.toLowerCase().endsWith('.pdf')) {
    throw new HttpError(502, 'Quiz link is not a PDF', 'Bad Gateway')
  }
  return raw
}
