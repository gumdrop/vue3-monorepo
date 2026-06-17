import { existsSync, readFileSync } from 'node:fs'
import Path from 'node:path'

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

interface GeminiGenerateContentResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string
      }>
    }
    finishReason?: string
    finishMessage?: string
  }>
}

const geminiModel = () => process.env['GEMINI_MODEL'] ?? 'gemini-3.5-flash'

const geminiApiKey = () => {
  const apiKey = process.env['GEMINI_API_KEY']?.trim()
  if (apiKey) return apiKey

  const candidatePaths = [
    Path.join(process.cwd(), 'gemini-api-key.txt'),
    Path.join(process.cwd(), '..', 'gemini-api-key.txt'),
  ]
  const apiKeyPath = candidatePaths.find((path) => existsSync(path))
  return apiKeyPath ? readFileSync(apiKeyPath, 'utf8').trim() : undefined
}

const modelPath = (model: string) => (model.startsWith('models/') ? model : `models/${model}`)

const thinkingConfig = (model: string) => {
  if (/^gemini-3/i.test(model)) {
    return { thinkingLevel: 'minimal' }
  }

  if (/^gemini-2\.5/i.test(model)) {
    return { thinkingBudget: 0 }
  }

  return undefined
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
  return generateGeminiSummary(buildPrompt(input), {
    failureLabel: 'fixture set summary',
    skipLabel: 'fixture set results summary',
  })
}

export async function generateCompetitionRoundup(
  input: CompetitionRoundupInput,
): Promise<FixtureSetSummary | undefined> {
  return generateGeminiSummary(buildCompetitionRoundupPrompt(input), {
    failureLabel: 'competition roundup',
    skipLabel: 'competition roundup',
  })
}

async function generateGeminiSummary(
  prompt: string,
  labels: { failureLabel: string; skipLabel: string },
): Promise<FixtureSetSummary | undefined> {
  const apiKey = geminiApiKey()
  if (!apiKey) {
    console.warn(`Skipping ${labels.skipLabel}: GEMINI_API_KEY is not configured`)
    return undefined
  }

  const model = geminiModel()
  const thinking = thinkingConfig(model)
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/${modelPath(model)}:generateContent`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.3,
          responseMimeType: 'text/plain',
          maxOutputTokens: 8192,
          ...(thinking ? { thinkingConfig: thinking } : {}),
        },
      }),
    },
  )

  if (!response.ok) {
    const body = await response.text()
    console.error(`Gemini ${labels.failureLabel} failed: ${response.status} ${body}`)
    return undefined
  }

  const data = (await response.json()) as GeminiGenerateContentResponse
  const candidate = data.candidates?.[0]
  if (candidate?.finishReason === 'MAX_TOKENS') {
    throw new Error(
      `Gemini ${labels.failureLabel} was truncated by maxOutputTokens${
        candidate.finishMessage ? `: ${candidate.finishMessage}` : ''
      }`,
    )
  }

  const text = candidate?.content?.parts
    ?.map((part) => part.text ?? '')
    .join('')
    .trim()

  return text ? { text, model } : undefined
}
