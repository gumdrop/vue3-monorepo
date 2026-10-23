import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const fixturesDir = fileURLToPath(new URL('./fixtures/', import.meta.url))

export const quizFixturePdfPath = () => `${fixturesDir}quiz-2026-10-13.pdf`

export const quizFixturePdfBytes = () => new Uint8Array(readFileSync(quizFixturePdfPath()))

export const quizFixturePassword = () => {
  const fromEnv = process.env['QUIZ_PDF_TEST_PASSWORD']?.trim()
  if (fromEnv) return fromEnv

  return readFileSync(`${fixturesDir}quiz-password.txt`, 'utf8').trim()
}
