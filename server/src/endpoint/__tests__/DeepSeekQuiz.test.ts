import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { generateMatchReport, parseQuiz } from '../DeepSeekResultsSummary'

const previousApiKey = process.env['DEEPSEEK_API_KEY']
const previousModel = process.env['DEEPSEEK_MODEL']

const validPaper = {
  rounds: [
    {
      round: 'ROUND ONE',
      questions: [
        { number: '1A', question: 'Q1A', answer: 'A1' },
        { number: '1B', question: 'Q1B', answer: 'B1' },
      ],
    },
    {
      round: 'ROUND THREE – INDIVIDUAL – PICK A SUBJECT',
      subjects: ['FILMS', 'ENGLISH GEOGRAPHY', 'FORMER COINS', 'AUTOMOTIVE ENGINEERS'],
      questions: [
        { number: '1A', question: 'Q1A', answer: 'A1' },
      ],
    },
  ],
}

const fetchJson = (content: string) =>
  vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ choices: [{ finish_reason: 'stop', message: { content } }] }),
  })

describe('DeepSeekResultsSummary quiz parsing', () => {
  beforeEach(() => {
    process.env['DEEPSEEK_API_KEY'] = 'test-api-key'
    delete process.env['DEEPSEEK_MODEL']
  })

  afterEach(() => {
    if (previousApiKey === undefined) delete process.env['DEEPSEEK_API_KEY']
    else process.env['DEEPSEEK_API_KEY'] = previousApiKey

    if (previousModel === undefined) delete process.env['DEEPSEEK_MODEL']
    else process.env['DEEPSEEK_MODEL'] = previousModel

    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('parses valid JSON and requests json_object output', async () => {
    const fetchMock = fetchJson(JSON.stringify(validPaper))
    vi.stubGlobal('fetch', fetchMock)

    await expect(parseQuiz('SOME QUIZ TEXT')).resolves.toEqual(validPaper)

    expect(fetchMock.mock.calls[0][0]).toBe('https://api.deepseek.com/chat/completions')
    const body = JSON.parse(fetchMock.mock.calls[0]?.[1]?.body as string)
    expect(body.response_format).toEqual({ type: 'json_object' })
    expect(body.messages[0].content).toContain('SOME QUIZ TEXT')
    expect(body.messages[0].content).toContain('Output only valid JSON')
  })

  it('rejects a response missing the rounds array', async () => {
    vi.stubGlobal('fetch', fetchJson(JSON.stringify({ notRounds: [] })))
    await expect(parseQuiz('TEXT')).rejects.toThrow('missing a rounds array')
  })

  it('rejects invalid JSON content', async () => {
    vi.stubGlobal('fetch', fetchJson('not json at all'))
    await expect(parseQuiz('TEXT')).rejects.toThrow('did not return valid JSON')
  })
})

describe('DeepSeekResultsSummary match reports', () => {
  beforeEach(() => {
    process.env['DEEPSEEK_API_KEY'] = 'test-api-key'
    delete process.env['DEEPSEEK_MODEL']
  })

  afterEach(() => {
    if (previousApiKey === undefined) delete process.env['DEEPSEEK_API_KEY']
    else process.env['DEEPSEEK_API_KEY'] = previousApiKey

    if (previousModel === undefined) delete process.env['DEEPSEEK_MODEL']
    else process.env['DEEPSEEK_MODEL'] = previousModel

    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('generates a Markdown report from recorded match data', async () => {
    const fetchMock = fetchJson('A close match with a strong beer round.')
    vi.stubGlobal('fetch', fetchMock)

    await expect(
      generateMatchReport({
        homeTeam: 'Alpha',
        awayTeam: 'Bravo',
        homeScore: 42,
        awayScore: 41,
        beerRoundHomeScore: 14,
        beerRoundAwayScore: 13,
        rounds: [
          {
            name: 'ROUND ONE',
            questions: [
              {
                number: '1A',
                question: 'Q1A',
                answer: 'A1',
                outcome: 'correct',
              },
            ],
          },
        ],
      }),
    ).resolves.toEqual({ text: 'A close match with a strong beer round.', model: 'deepseek-chat' })

    const body = JSON.parse(fetchMock.mock.calls[0]?.[1]?.body as string)
    expect(body.messages[0].content).toContain('Alpha vs Bravo')
    expect(body.messages[0].content).toContain('Final score (main quiz): Alpha 42-41 Bravo')
    expect(body.messages[0].content).toContain(
      'Beer leg (separate, does not count): Alpha 14-13 Bravo',
    )
    expect(body.messages[0].content).toContain('ROUND ONE')
  })
})
