import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  generateCompetitionRoundup,
  generateFixtureSetResultsSummary,
} from '../DeepSeekResultsSummary'

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

const previousApiKey = process.env['DEEPSEEK_API_KEY']
const previousModel = process.env['DEEPSEEK_MODEL']

describe('DeepSeekResultsSummary', () => {
  beforeEach(() => {
    process.env['DEEPSEEK_API_KEY'] = 'test-api-key'
    delete process.env['DEEPSEEK_MODEL']
  })

  afterEach(() => {
    if (previousApiKey === undefined) {
      delete process.env['DEEPSEEK_API_KEY']
    } else {
      process.env['DEEPSEEK_API_KEY'] = previousApiKey
    }

    if (previousModel === undefined) {
      delete process.env['DEEPSEEK_MODEL']
    } else {
      process.env['DEEPSEEK_MODEL'] = previousModel
    }

    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('requests enough output budget for homepage summaries', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          {
            finish_reason: 'stop',
            message: { content: 'Alpha won a close Round 3 match.' },
          },
        ],
      }),
    })
    vi.stubGlobal('fetch', fetchMock)

    await expect(generateFixtureSetResultsSummary(input)).resolves.toEqual({
      text: 'Alpha won a close Round 3 match.',
      model: 'deepseek-chat',
    })

    expect(fetchMock.mock.calls[0][0]).toBe('https://api.deepseek.com/chat/completions')
    const body = JSON.parse(fetchMock.mock.calls[0]?.[1]?.body as string)
    expect(body).toEqual({
      model: 'deepseek-chat',
      messages: [
        {
          role: 'user',
          content: expect.stringContaining('Produce Markdown.'),
        },
      ],
      temperature: 0.3,
      max_tokens: 8192,
      stream: false,
    })
    expect(body.messages[0].content).toContain(
      'Return only Markdown body text, with no heading.',
    )
  })

  it('builds competition roundup prompts from fixture-set summaries and result lines', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          {
            finish_reason: 'stop',
            message: { content: 'Alpha held off Bravo to take the League Championship.' },
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
      model: 'deepseek-chat',
    })

    const body = JSON.parse(fetchMock.mock.calls[0]?.[1]?.body as string)
    const prompt = body.messages[0].content
    expect(prompt).toContain('completed team competition')
    expect(prompt).toContain('Fixture-set summary: Alpha opened with a narrow win.')
    expect(prompt).toContain('- Alpha 43-42 Bravo')
    expect(prompt).toContain('Return only Markdown body text, with no heading.')
  })

  it('includes league statistics and table progression in competition roundup prompts', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          {
            finish_reason: 'stop',
            message: { content: 'Alpha dominated the league from start to finish.' },
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
      model: 'deepseek-chat',
    })

    const body = JSON.parse(fetchMock.mock.calls[0]?.[1]?.body as string)
    const prompt = body.messages[0].content
    expect(prompt).toContain('Season statistics:')
    expect(prompt).toContain('- Average score: 45.50')
    expect(prompt).toContain('League table snapshots (showing progression):')
    expect(prompt).toContain('1. Alpha P:10 W:8 D:1 L:1 F:450 A:400 Pts:17')
    expect(prompt).toContain('Use the league table snapshots to describe how the race and positions changed over time')
  })

  it('rejects summaries that DeepSeek reports as truncated', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [
            {
              finish_reason: 'length',
              message: { content: 'In Round 3 of the League Championship,' },
            },
          ],
        }),
      }),
    )

    await expect(generateFixtureSetResultsSummary(input)).rejects.toThrow(
      'DeepSeek fixture set summary was truncated by max_tokens',
    )
  })

  it('skips generation when no API key is configured', async () => {
    delete process.env['DEEPSEEK_API_KEY']
    vi.spyOn(process, 'cwd').mockReturnValue('/tmp/no-deepseek-key')
    vi.stubGlobal('fetch', vi.fn())
    vi.spyOn(console, 'warn').mockImplementation(() => undefined)

    await expect(generateFixtureSetResultsSummary(input)).resolves.toBeUndefined()

    expect(fetch).not.toHaveBeenCalled()
    expect(console.warn).toHaveBeenCalledWith(
      'Skipping fixture set results summary: DEEPSEEK_API_KEY is not configured',
    )
  })

  it('uses the configured DeepSeek model and includes no-report fixture text', async () => {
    process.env['DEEPSEEK_MODEL'] = 'deepseek-reasoner'
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          {
            finish_reason: 'stop',
            message: { content: 'No reports were submitted.' },
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
      model: 'deepseek-reasoner',
    })

    expect(fetchMock.mock.calls[0][0]).toBe('https://api.deepseek.com/chat/completions')
    const body = JSON.parse(fetchMock.mock.calls[0]?.[1]?.body as string)
    expect(body.model).toBe('deepseek-reasoner')
    expect(body.messages[0].content).toContain('Report: none submitted')
  })

  it('returns undefined for failed or empty DeepSeek responses', async () => {
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
    expect(errorSpy).toHaveBeenCalledWith('DeepSeek fixture set summary failed: 400 bad request')

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ choices: [{ finish_reason: 'stop', message: { content: '' } }] }),
      }),
    )

    await expect(generateFixtureSetResultsSummary(input)).resolves.toBeUndefined()
  })
})
