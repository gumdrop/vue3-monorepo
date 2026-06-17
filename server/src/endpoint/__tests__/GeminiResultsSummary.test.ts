import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  generateCompetitionRoundup,
  generateFixtureSetResultsSummary,
} from '../GeminiResultsSummary'

const input = {
  competitionName: 'League Championship',
  fixtureSetDescription: 'Round 3',
  fixtureSetDate: '2026-05-31',
  fixtures: [
    {
      homeTeam: 'Alpha',
      awayTeam: 'Bravo',
      homeScore: 43,
      awayScore: 42,
      reports: ['Alpha edged a tight match.'],
    },
  ],
}

const previousApiKey = process.env['GEMINI_API_KEY']
const previousModel = process.env['GEMINI_MODEL']

describe('GeminiResultsSummary', () => {
  beforeEach(() => {
    process.env['GEMINI_API_KEY'] = 'test-api-key'
    delete process.env['GEMINI_MODEL']
  })

  afterEach(() => {
    if (previousApiKey === undefined) {
      delete process.env['GEMINI_API_KEY']
    } else {
      process.env['GEMINI_API_KEY'] = previousApiKey
    }

    if (previousModel === undefined) {
      delete process.env['GEMINI_MODEL']
    } else {
      process.env['GEMINI_MODEL'] = previousModel
    }

    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('requests enough output budget for homepage summaries', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        candidates: [
          {
            finishReason: 'STOP',
            content: {
              parts: [{ text: 'Alpha won a close Round 3 match.' }],
            },
          },
        ],
      }),
    })
    vi.stubGlobal('fetch', fetchMock)

    await expect(generateFixtureSetResultsSummary(input)).resolves.toEqual({
      text: 'Alpha won a close Round 3 match.',
      model: 'gemini-3.5-flash',
    })

    const body = JSON.parse(fetchMock.mock.calls[0]?.[1]?.body as string)
    expect(body.generationConfig).toEqual({
      temperature: 0.3,
      responseMimeType: 'text/plain',
      maxOutputTokens: 8192,
      thinkingConfig: { thinkingLevel: 'minimal' },
    })
    expect(body.contents[0].parts[0].text).toContain('Produce Markdown.')
    expect(body.contents[0].parts[0].text).toContain(
      'Return only Markdown body text, with no heading.',
    )
  })

  it('builds competition roundup prompts from fixture-set summaries and result lines', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        candidates: [
          {
            finishReason: 'STOP',
            content: {
              parts: [{ text: 'Alpha held off Bravo to take the League Championship.' }],
            },
          },
        ],
      }),
    })
    vi.stubGlobal('fetch', fetchMock)

    await expect(
      generateCompetitionRoundup({
        competitionName: 'League Championship',
        fixtureSets: [
          {
            fixtureSetDescription: 'Week 1',
            fixtureSetDate: '2026-05-31',
            summary: 'Alpha opened with a narrow win.',
            fixtures: [
              {
                homeTeam: 'Alpha',
                awayTeam: 'Bravo',
                homeScore: 43,
                awayScore: 42,
              },
            ],
          },
        ],
      }),
    ).resolves.toEqual({
      text: 'Alpha held off Bravo to take the League Championship.',
      model: 'gemini-3.5-flash',
    })

    const body = JSON.parse(fetchMock.mock.calls[0]?.[1]?.body as string)
    const prompt = body.contents[0].parts[0].text
    expect(prompt).toContain('completed team competition')
    expect(prompt).toContain('Fixture-set summary: Alpha opened with a narrow win.')
    expect(prompt).toContain('- Alpha 43-42 Bravo')
    expect(prompt).toContain('Return only Markdown body text, with no heading.')
  })

  it('includes league statistics and table progression in competition roundup prompts', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        candidates: [
          {
            finishReason: 'STOP',
            content: {
              parts: [{ text: 'Alpha dominated the league from start to finish.' }],
            },
          },
        ],
      }),
    })
    vi.stubGlobal('fetch', fetchMock)

    await expect(
      generateCompetitionRoundup({
        competitionName: 'Premier League',
        fixtureSets: [
          {
            fixtureSetDescription: 'Final Day',
            fixtureSetDate: '2026-06-15',
            summary: 'Alpha secured the title.',
            fixtures: [{ homeTeam: 'Alpha', awayTeam: 'Bravo', homeScore: 50, awayScore: 40 }],
          },
        ],
        statistics: {
          averageScore: 45.5,
          averageWinningScore: 48.2,
          averageLosingScore: 42.8,
          tableSnapshots: [
            {
              fixtureSetDescription: 'Final Day',
              fixtureSetDate: '2026-06-15',
              tables: [
                {
                  description: 'Main Table',
                  rows: [
                    {
                      team: 'Alpha',
                      played: 10,
                      won: 8,
                      drawn: 1,
                      lost: 1,
                      matchPointsFor: 450,
                      matchPointsAgainst: 400,
                      leaguePoints: 17,
                      position: '1',
                    },
                  ],
                },
              ],
            },
          ],
        },
      }),
    ).resolves.toEqual({
      text: 'Alpha dominated the league from start to finish.',
      model: 'gemini-3.5-flash',
    })

    const body = JSON.parse(fetchMock.mock.calls[0]?.[1]?.body as string)
    const prompt = body.contents[0].parts[0].text
    expect(prompt).toContain('Season statistics:')
    expect(prompt).toContain('- Average score: 45.50')
    expect(prompt).toContain('League table snapshots (showing progression):')
    expect(prompt).toContain('1. Alpha P:10 W:8 D:1 L:1 F:450 A:400 Pts:17')
    expect(prompt).toContain('Use the league table snapshots to describe how the title race or positions changed over time.')
  })

  it('rejects summaries that Gemini reports as truncated', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          candidates: [
            {
              finishReason: 'MAX_TOKENS',
              finishMessage: 'The configured output token limit was reached.',
              content: {
                parts: [{ text: 'In Round 3 of the League Championship,' }],
              },
            },
          ],
        }),
      }),
    )

    await expect(generateFixtureSetResultsSummary(input)).rejects.toThrow(
      'Gemini fixture set summary was truncated by maxOutputTokens',
    )
  })

  it('skips generation when no API key is configured', async () => {
    delete process.env['GEMINI_API_KEY']
    vi.spyOn(process, 'cwd').mockReturnValue('/tmp/no-gemini-key')
    vi.stubGlobal('fetch', vi.fn())
    vi.spyOn(console, 'warn').mockImplementation(() => undefined)

    await expect(generateFixtureSetResultsSummary(input)).resolves.toBeUndefined()

    expect(fetch).not.toHaveBeenCalled()
    expect(console.warn).toHaveBeenCalledWith(
      'Skipping fixture set results summary: GEMINI_API_KEY is not configured',
    )
  })

  it('uses the configured Gemini model and matching thinking config', async () => {
    process.env['GEMINI_MODEL'] = 'gemini-2.5-flash'
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        candidates: [
          {
            finishReason: 'STOP',
            content: {
              parts: [{ text: 'Alpha won.' }],
            },
          },
        ],
      }),
    })
    vi.stubGlobal('fetch', fetchMock)

    await expect(generateFixtureSetResultsSummary(input)).resolves.toEqual({
      text: 'Alpha won.',
      model: 'gemini-2.5-flash',
    })

    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',
    )
    const body = JSON.parse(fetchMock.mock.calls[0][1].body as string)
    expect(body.generationConfig.thinkingConfig).toEqual({ thinkingBudget: 0 })
  })

  it('omits thinking config for older models and includes no-report fixture text', async () => {
    process.env['GEMINI_MODEL'] = 'models/gemini-1.5-flash'
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        candidates: [
          {
            finishReason: 'STOP',
            content: {
              parts: [{ text: 'No reports were submitted.' }],
            },
          },
        ],
      }),
    })
    vi.stubGlobal('fetch', fetchMock)

    await expect(
      generateFixtureSetResultsSummary({
        ...input,
        fixtures: [{ ...input.fixtures[0], reports: [] }],
      }),
    ).resolves.toEqual({
      text: 'No reports were submitted.',
      model: 'models/gemini-1.5-flash',
    })

    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent',
    )
    const body = JSON.parse(fetchMock.mock.calls[0][1].body as string)
    expect(body.contents[0].parts[0].text).toContain('Report: none submitted')
    expect(body.generationConfig).not.toHaveProperty('thinkingConfig')
  })

  it('returns undefined for failed or empty Gemini responses', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: async () => 'bad request',
      }),
    )

    await expect(generateFixtureSetResultsSummary(input)).resolves.toBeUndefined()
    expect(errorSpy).toHaveBeenCalledWith('Gemini fixture set summary failed: 400 bad request')

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ candidates: [{ finishReason: 'STOP', content: { parts: [] } }] }),
      }),
    )

    await expect(generateFixtureSetResultsSummary(input)).resolves.toBeUndefined()
  })
})
