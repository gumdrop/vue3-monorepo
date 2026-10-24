import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { generateMatchReport } from '../DeepSeekResultsSummary'

const previousApiKey = process.env['DEEPSEEK_API_KEY']
const previousModel = process.env['DEEPSEEK_MODEL']

const fetchJson = (content: string) =>
  vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ choices: [{ finish_reason: 'stop', message: { content } }] }),
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

  it('mentions the cup tie-break when one decides the match', async () => {
    const fetchMock = fetchJson('Decided on a coin toss.')
    vi.stubGlobal('fetch', fetchMock)

    await generateMatchReport({
      homeTeam: 'Alpha',
      awayTeam: 'Bravo',
      homeScore: 51,
      awayScore: 50,
      beerRoundHomeScore: 0,
      beerRoundAwayScore: 0,
      rounds: [],
      tieBreak: { winner: 'home', method: 'the coin toss' },
    })

    const body = JSON.parse(fetchMock.mock.calls[0]?.[1]?.body as string)
    expect(body.messages[0].content).toContain('Final score: Alpha 51-50 Bravo')
    expect(body.messages[0].content).toContain(
      'Cup tie-break: the match was level after 10 rounds.',
    )
    expect(body.messages[0].content).toContain('Alpha won on the coin toss.')
    expect(body.messages[0].content).toContain('Beer leg: used for the cup tie-break sections.')
  })
})
