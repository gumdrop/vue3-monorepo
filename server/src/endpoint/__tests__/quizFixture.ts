import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const fixturesDir = fileURLToPath(new URL('./fixtures/', import.meta.url))

export const quizFixturePdfPath = () => `${fixturesDir}quiz-2026-10-13.pdf`

export const quizFixturePdfBytes = () => new Uint8Array(readFileSync(quizFixturePdfPath()))

export const quizFixturePassword = () => {
  // `QUIZ_PDF_TEST_PASSWORD` overrides the committed fixture password, e.g. if
  // the fixture is later replaced with a new sample paper.
  const fromEnv = process.env['QUIZ_PDF_TEST_PASSWORD']?.trim()
  if (fromEnv) return fromEnv

  // The committed password decrypts the 13-Oct-2026 sample paper only. It is
  // not a live secret: the per-week quiz password a question master supplies
  // at runtime is never persisted (FR-1.2).
  return readFileSync(`${fixturesDir}quiz-password.txt`, 'utf8').trim()
}
