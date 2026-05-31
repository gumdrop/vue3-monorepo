import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { generateFixtureSetResultsSummary } from '../GeminiResultsSummary'

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
