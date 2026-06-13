import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  docRef: vi.fn((entity) => ({
    id: typeof entity === 'string' ? entity.split('/').pop() : entity.id,
    path: typeof entity === 'string' ? entity : entity.path,
  })),
  generateCompetitionRoundup: vi.fn(),
  generateFixtureSetResultsSummary: vi.fn(),
  list: vi.fn(),
  load: vi.fn(),
  save: vi.fn(),
  saveAll: vi.fn(),
  calculateStats: vi.fn(),
  updateAggregationForCompletedFixtureSet: vi.fn(),
  updateForFixture: vi.fn(),
}))

vi.mock('../../storage/Storage', () => ({
  docRef: mocks.docRef,
  entityPath: vi.fn((type: string, id: string) => `${type}/${id}`),
  list: mocks.list,
  load: mocks.load,
  save: mocks.save,
  saveAll: mocks.saveAll,
}))

vi.mock('../GeminiResultsSummary', () => ({
  generateCompetitionRoundup: mocks.generateCompetitionRoundup,
  generateFixtureSetResultsSummary: mocks.generateFixtureSetResultsSummary,
}))

vi.mock('../StatisticsUtils', () => ({
  calculateStats: mocks.calculateStats,
  updateForFixture: mocks.updateForFixture,
}))

vi.mock('../SeasonStatisticsAggregationUtils', () => ({
  updateAggregationForCompletedFixtureSet: mocks.updateAggregationForCompletedFixtureSet,
}))

import {
  regenerateCompetitionRoundup,
  regenerateFixtureSetResultsSummary,
  resultSubmission,
  statsRegenerate,
} from '../TaskFunctions'

const fixtureSetPath = 'season/season-1/competition/league/fixtures/week-1'
const fixturePath = (id: string) => `${fixtureSetPath}/fixture/${id}`

describe('TaskFunctions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.save.mockImplementation(async (entity) => mocks.docRef(entity))
  })

  it('generates a Gemini summary when the submitted result completes the fixture set', async () => {
    const queueMicrotaskSpy = vi
      .spyOn(globalThis, 'queueMicrotask')
      .mockImplementation((callback: () => void) => callback())
    const user = { id: 'user-1', path: 'user/user-1' }
    const season = { id: 'season-1', path: 'season/season-1' }
    const teamA = {
      id: 'team-a',
      path: 'team/team-a',
      name: 'Alpha',
      shortName: 'Alpha',
    }
    const teamB = {
      id: 'team-b',
      path: 'team/team-b',
      name: 'Bravo',
      shortName: 'Bravo',
    }
    const teamC = {
      id: 'team-c',
      path: 'team/team-c',
      name: 'Charlie',
      shortName: 'Charlie',
    }
    const teamD = {
      id: 'team-d',
      path: 'team/team-d',
      name: 'Delta',
      shortName: 'Delta',
    }
    const fixtureOne = {
      id: 'fixture-1',
      path: fixturePath('fixture-1'),
      home: { id: 'team-a', path: 'team/team-a' },
      away: { id: 'team-b', path: 'team/team-b' },
    }
    const fixtureTwo = {
      id: 'fixture-2',
      path: fixturePath('fixture-2'),
      home: { id: 'team-c', path: 'team/team-c' },
      away: { id: 'team-d', path: 'team/team-d' },
      result: { homeScore: 44, awayScore: 41 },
    }
    const fixtureSet = {
      id: 'week-1',
      path: fixtureSetPath,
      description: 'Week 1',
      date: '2026-05-31',
      start: '19:30',
    }

    mocks.load.mockImplementation(async (pathish) => {
      const path = typeof pathish === 'string' ? pathish : pathish.path
      if (path === 'user/user-1') return user
      if (path === 'season/season-1') return season
      if (path === 'season/season-1/competition/league') {
        return { id: 'league', path, name: 'League', _name: 'league' }
      }
      if (path === fixturePath('fixture-1')) return fixtureOne
      if (path === fixtureSetPath) return fixtureSet
      if (path === 'team/team-a') return teamA
      if (path === 'team/team-b') return teamB
      if (path === 'team/team-c') return teamC
      if (path === 'team/team-d') return teamD
      if (path === 'text/report-1') {
        return {
          id: 'report-1',
          path,
          text: 'Alpha edged a close match.',
          mimeType: 'text/markdown',
        }
      }
      return undefined
    })
    mocks.list.mockImplementation(async (type, parent) => {
      if (type === 'team') return [teamA, teamB, teamC, teamD]
      if (type === 'member' && parent === teamA) {
        return [
          {
            id: 'members',
            path: 'team/team-a/member/members',
            users: [user],
          },
        ]
      }
      if (type === 'fixture' && parent === fixtureSetPath) return [fixtureOne, fixtureTwo]
      if (type === 'report' && parent === fixturePath('fixture-1')) {
        return [
          {
            id: 'report-1',
            path: `${fixturePath('fixture-1')}/report/report-1`,
            team: { id: 'team-a', path: 'team/team-a' },
            text: { id: 'report-1', path: 'text/report-1' },
          },
        ]
      }
      if (type === 'report') return []
      return []
    })
    mocks.generateFixtureSetResultsSummary.mockResolvedValue({
      text: 'Alpha and Charlie opened with wins.',
      model: 'gemini-test',
    })

    await resultSubmission({
      fixtures: [{ fixturePath: fixturePath('fixture-1'), homeScore: 43, awayScore: 42 }],
      reportText: 'Submitted report',
      userID: 'user-1',
    })
    await Promise.resolve()

    expect(mocks.generateFixtureSetResultsSummary).toHaveBeenCalledWith({
      competitionName: 'League',
      fixtureSetDescription: 'Week 1',
      fixtureSetDate: '2026-05-31',
      fixtures: [
        {
          homeTeam: 'Alpha',
          awayTeam: 'Bravo',
          homeScore: 43,
          awayScore: 42,
          reports: ['Alpha: Alpha edged a close match.'],
        },
        {
          homeTeam: 'Charlie',
          awayTeam: 'Delta',
          homeScore: 44,
          awayScore: 41,
          reports: [],
        },
      ],
    })
    expect(queueMicrotaskSpy).toHaveBeenCalledWith(expect.any(Function))
    expect(mocks.calculateStats).toHaveBeenCalledWith(season)
    expect(mocks.updateForFixture).not.toHaveBeenCalled()
    expect(mocks.updateAggregationForCompletedFixtureSet).toHaveBeenCalledWith(fixtureSetPath)
    expect(fixtureSet).toEqual(
      expect.objectContaining({
        resultsSummary: expect.objectContaining({
          path: expect.stringMatching(/^text\//),
        }),
        resultsSummaryModel: 'gemini-test',
      }),
    )
    expect(mocks.save).toHaveBeenCalledWith(
      expect.objectContaining({
        path: expect.stringMatching(/^text\//),
        text: 'Alpha and Charlie opened with wins.',
        mimeType: 'text/markdown',
      }),
    )
    expect(mocks.save).toHaveBeenCalledWith(fixtureSet)

    queueMicrotaskSpy.mockRestore()
  })

  it('creates a competition roundup when the final team competition fixture set is complete', async () => {
    const user = { id: 'user-1', path: 'user/user-1' }
    const competition = {
      id: 'league',
      path: 'season/season-1/competition/league',
      name: 'League',
      _name: 'league',
    }
    const teamA = {
      id: 'team-a',
      path: 'team/team-a',
      name: 'Alpha',
      shortName: 'Alpha',
    }
    const teamB = {
      id: 'team-b',
      path: 'team/team-b',
      name: 'Bravo',
      shortName: 'Bravo',
    }
    const teamC = {
      id: 'team-c',
      path: 'team/team-c',
      name: 'Charlie',
      shortName: 'Charlie',
    }
    const teamD = {
      id: 'team-d',
      path: 'team/team-d',
      name: 'Delta',
      shortName: 'Delta',
    }
    const weekTwoPath = 'season/season-1/competition/league/fixtures/week-2'
    const weekTwoFixturePath = `${weekTwoPath}/fixture/fixture-3`
    const fixtureOne = {
      id: 'fixture-1',
      path: fixturePath('fixture-1'),
      home: { id: 'team-a', path: 'team/team-a' },
      away: { id: 'team-b', path: 'team/team-b' },
    }
    const fixtureTwo = {
      id: 'fixture-2',
      path: fixturePath('fixture-2'),
      home: { id: 'team-c', path: 'team/team-c' },
      away: { id: 'team-d', path: 'team/team-d' },
      result: { homeScore: 44, awayScore: 41 },
    }
    const fixtureThree = {
      id: 'fixture-3',
      path: weekTwoFixturePath,
      home: { id: 'team-a', path: 'team/team-a' },
      away: { id: 'team-d', path: 'team/team-d' },
      result: { homeScore: 40, awayScore: 39 },
    }
    const weekOne = {
      id: 'week-1',
      path: fixtureSetPath,
      description: 'Week 1',
      date: '2026-05-31',
      start: '19:30',
      resultsSummary: { id: 'summary-week-1', path: 'text/summary-week-1' },
    }
    const weekTwo = {
      id: 'week-2',
      path: weekTwoPath,
      description: 'Week 2',
      date: '2026-06-07',
      start: '19:30',
      resultsSummary: { id: 'summary-week-2', path: 'text/summary-week-2' },
    }
    const weekOneSummary = {
      id: 'summary-week-1',
      path: 'text/summary-week-1',
      text: 'Old week 1 summary',
      mimeType: 'text/markdown',
    }
    const weekTwoSummary = {
      id: 'summary-week-2',
      path: 'text/summary-week-2',
      text: 'Week 2 belonged to Alpha.',
      mimeType: 'text/markdown',
    }

    mocks.load.mockImplementation(async (pathish) => {
      const path = typeof pathish === 'string' ? pathish : pathish.path
      if (path === 'user/user-1') return user
      if (path === competition.path) return competition
      if (path === fixtureOne.path) return fixtureOne
      if (path === fixtureSetPath) return weekOne
      if (path === 'team/team-a') return teamA
      if (path === 'team/team-b') return teamB
      if (path === 'team/team-c') return teamC
      if (path === 'team/team-d') return teamD
      if (path === 'text/summary-week-1') return weekOneSummary
      if (path === 'text/summary-week-2') return weekTwoSummary
      return undefined
    })
    mocks.list.mockImplementation(async (type, parent) => {
      if (type === 'fixtures' && parent === competition.path) return [weekTwo, weekOne]
      if (type === 'fixture' && parent === fixtureSetPath) return [fixtureOne, fixtureTwo]
      if (type === 'fixture' && parent === weekTwoPath) return [fixtureThree]
      if (type === 'report') return []
      return []
    })
    mocks.generateFixtureSetResultsSummary.mockResolvedValue({
      text: 'Week 1 swung on Alpha.',
      model: 'gemini-week',
    })
    mocks.generateCompetitionRoundup.mockResolvedValue({
      text: 'League season roundup.',
      model: 'gemini-roundup',
    })

    await resultSubmission({
      fixtures: [{ fixturePath: fixtureOne.path, homeScore: 43, awayScore: 42 }],
      reportText: undefined,
      userID: 'user-1',
    })

    expect(mocks.generateCompetitionRoundup).toHaveBeenCalledWith({
      competitionName: 'League',
      fixtureSets: [
        {
          fixtureSetDescription: 'Week 1',
          fixtureSetDate: '2026-05-31',
          summary: 'Week 1 swung on Alpha.',
          fixtures: [
            {
              homeTeam: 'Alpha',
              awayTeam: 'Bravo',
              homeScore: 43,
              awayScore: 42,
            },
            {
              homeTeam: 'Charlie',
              awayTeam: 'Delta',
              homeScore: 44,
              awayScore: 41,
            },
          ],
        },
        {
          fixtureSetDescription: 'Week 2',
          fixtureSetDate: '2026-06-07',
          summary: 'Week 2 belonged to Alpha.',
          fixtures: [
            {
              homeTeam: 'Alpha',
              awayTeam: 'Delta',
              homeScore: 40,
              awayScore: 39,
            },
          ],
        },
      ],
    })
    expect(mocks.save).toHaveBeenCalledWith(
      expect.objectContaining({
        path: expect.stringMatching(/^text\//),
        text: 'League season roundup.',
        mimeType: 'text/markdown',
      }),
    )
    expect(mocks.save).toHaveBeenCalledWith(
      expect.objectContaining({
        path: competition.path,
        roundup: expect.objectContaining({
          path: expect.stringMatching(/^text\//),
        }),
        roundupGeneratedAt: expect.any(String),
        roundupModel: 'gemini-roundup',
      }),
    )
  })

  it('rejects manual competition roundup regeneration for unsupported or incomplete competitions', async () => {
    const competitionPath = 'season/season-1/competition/league'

    mocks.load.mockResolvedValueOnce(undefined)
    await expect(regenerateCompetitionRoundup(competitionPath)).rejects.toThrow(
      `Competition not found: ${competitionPath}`,
    )

    mocks.load.mockResolvedValueOnce({
      id: 'finals',
      path: 'season/season-1/competition/finals',
      _name: 'singleton',
    })
    await expect(
      regenerateCompetitionRoundup('season/season-1/competition/finals'),
    ).rejects.toThrow('Cannot generate a roundup for a singleton competition')

    mocks.load.mockResolvedValueOnce({
      id: 'league',
      path: competitionPath,
      name: 'League',
      _name: 'league',
    })
    mocks.list.mockResolvedValueOnce([])
    await expect(regenerateCompetitionRoundup(competitionPath)).rejects.toThrow(
      'Cannot generate a roundup for a competition with no fixture groups',
    )

    mocks.load.mockResolvedValueOnce({
      id: 'league',
      path: competitionPath,
      name: 'League',
      _name: 'league',
    })
    mocks.list
      .mockResolvedValueOnce([
        {
          id: 'week-1',
          path: fixtureSetPath,
          description: 'Week 1',
          date: '2026-05-31',
        },
      ])
      .mockResolvedValueOnce([
        {
          id: 'fixture-1',
          path: fixturePath('fixture-1'),
        },
      ])
    await expect(regenerateCompetitionRoundup(competitionPath)).rejects.toThrow(
      'Cannot generate a roundup until all fixture groups have results',
    )
  })

  it('does not generate a summary while any fixture in the set is missing a result', async () => {
    const queueMicrotaskSpy = vi
      .spyOn(globalThis, 'queueMicrotask')
      .mockImplementation((callback: () => void) => callback())
    const user = { id: 'user-1', path: 'user/user-1' }
    const teamA = {
      id: 'team-a',
      path: 'team/team-a',
    }
    const fixtureOne = {
      id: 'fixture-1',
      path: fixturePath('fixture-1'),
      home: { id: 'team-a', path: 'team/team-a' },
      away: { id: 'team-b', path: 'team/team-b' },
    }
    const fixtureTwo = {
      id: 'fixture-2',
      path: fixturePath('fixture-2'),
      home: { id: 'team-c', path: 'team/team-c' },
      away: { id: 'team-d', path: 'team/team-d' },
    }
    const fixtureSet = {
      id: 'week-1',
      path: fixtureSetPath,
      description: 'Week 1',
      date: '2026-05-31',
      start: '19:30',
    }

    mocks.load.mockImplementation(async (pathish) => {
      const path = typeof pathish === 'string' ? pathish : pathish.path
      if (path === 'user/user-1') return user
      if (path === 'season/season-1/competition/league') {
        return { id: 'league', path, name: 'League', _name: 'league' }
      }
      if (path === fixturePath('fixture-1')) return fixtureOne
      if (path === fixtureSetPath) return fixtureSet
      return undefined
    })
    mocks.list.mockImplementation(async (type, parent) => {
      if (type === 'team') return [teamA]
      if (type === 'fixture' && parent === fixtureSetPath) return [fixtureOne, fixtureTwo]
      return []
    })

    await resultSubmission({
      fixtures: [{ fixturePath: fixturePath('fixture-1'), homeScore: 43, awayScore: 42 }],
      reportText: undefined,
      userID: 'user-1',
    })

    expect(mocks.generateFixtureSetResultsSummary).not.toHaveBeenCalled()
    expect(mocks.updateAggregationForCompletedFixtureSet).not.toHaveBeenCalled()
    expect(queueMicrotaskSpy).not.toHaveBeenCalled()
    expect(mocks.calculateStats).not.toHaveBeenCalled()

    queueMicrotaskSpy.mockRestore()
  })

  it('leaves completed fixture set summaries unchanged when Gemini returns empty text', async () => {
    const user = { id: 'user-1', path: 'user/user-1' }
    const teamA = {
      id: 'team-a',
      path: 'team/team-a',
    }
    const fixture = {
      id: 'fixture-1',
      path: fixturePath('fixture-1'),
      home: { id: 'team-a', path: 'team/team-a' },
      away: { id: 'team-b', path: 'team/team-b' },
    }
    const fixtureSet = {
      id: 'week-1',
      path: fixtureSetPath,
      description: 'Week 1',
      date: '2026-05-31',
      start: '19:30',
    }

    mocks.load.mockImplementation(async (pathish) => {
      const path = typeof pathish === 'string' ? pathish : pathish.path
      if (path === 'user/user-1') return user
      if (path === 'season/season-1/competition/league') {
        return { id: 'league', path, name: 'League', _name: 'league' }
      }
      if (path === fixture.path) return fixture
      if (path === fixtureSetPath) return fixtureSet
      return undefined
    })
    mocks.list.mockImplementation(async (type, parent) => {
      if (type === 'team') return [teamA]
      if (type === 'fixture' && parent === fixtureSetPath) return [fixture]
      if (type === 'report') return []
      return []
    })
    mocks.generateFixtureSetResultsSummary.mockResolvedValue(undefined)

    await resultSubmission({
      fixtures: [{ fixturePath: fixture.path, homeScore: 43, awayScore: 42 }],
      reportText: undefined,
      userID: 'user-1',
    })

    expect(mocks.generateFixtureSetResultsSummary).toHaveBeenCalled()
    expect(mocks.updateAggregationForCompletedFixtureSet).toHaveBeenCalledWith(fixtureSetPath)
    expect(fixtureSet).not.toHaveProperty('resultsSummary')
    expect(mocks.save).not.toHaveBeenCalledWith(
      expect.objectContaining({
        path: expect.stringMatching(/^text\//),
      }),
    )
  })

  it('regenerates a completed fixture set summary using an existing text document', async () => {
    const fixtureSet = {
      id: 'week-1',
      path: fixtureSetPath,
      description: 'Week 1',
      date: '2026-05-31',
      start: '19:30',
      resultsSummary: { id: 'summary-existing', path: 'text/summary-existing' },
    }
    const existingSummary = {
      id: 'summary-existing',
      path: 'text/summary-existing',
      text: 'Old summary',
      mimeType: 'text/markdown',
    }
    const fixture = {
      id: 'fixture-1',
      path: fixturePath('fixture-1'),
      home: { id: 'team-a', path: 'team/team-a' },
      away: { id: 'team-b', path: 'team/team-b' },
      result: { homeScore: 43, awayScore: 42 },
    }
    const longReport = `  ${'Alpha '.repeat(260)}  `

    mocks.load.mockImplementation(async (pathish) => {
      const path = typeof pathish === 'string' ? pathish : pathish.path
      if (path === fixtureSetPath) return fixtureSet
      if (path === 'season/season-1/competition/league') {
        return { id: 'league', path, name: 'League', _name: 'league' }
      }
      if (path === 'team/team-a') return { id: 'team-a', path, shortName: 'Alpha' }
      if (path === 'team/team-b') return { id: 'team-b', path, name: 'Bravo' }
      if (path === 'text/report-1') {
        return {
          id: 'report-1',
          path,
          text: longReport,
          mimeType: 'text/markdown',
        }
      }
      if (path === 'text/summary-existing') return existingSummary
      return undefined
    })
    mocks.list.mockImplementation(async (type, parent) => {
      if (type === 'fixture' && parent === fixtureSetPath) return [fixture]
      if (type === 'report' && parent === fixture.path) {
        return [
          {
            id: 'report-1',
            path: `${fixture.path}/report/report-1`,
            team: { id: 'team-a', path: 'team/team-a' },
            text: { id: 'report-1', path: 'text/report-1' },
          },
        ]
      }
      return []
    })
    mocks.generateFixtureSetResultsSummary.mockResolvedValue({
      text: 'Alpha edged Bravo.',
      model: 'gemini-test',
    })

    await expect(regenerateFixtureSetResultsSummary(fixtureSetPath)).resolves.toBe(fixtureSet)

    const report = mocks.generateFixtureSetResultsSummary.mock.calls[0][0].fixtures[0].reports[0]
    expect(report).toMatch(/^Alpha: Alpha Alpha/)
    expect(report).toHaveLength(1207)
    expect(report.endsWith('...')).toBe(true)
    expect(mocks.save).toHaveBeenCalledWith({
      ...existingSummary,
      text: 'Alpha edged Bravo.',
      mimeType: 'text/markdown',
    })
    expect(mocks.save).toHaveBeenCalledWith(
      expect.objectContaining({
        resultsSummary: { id: 'summary-existing', path: 'text/summary-existing' },
        resultsSummaryModel: 'gemini-test',
        resultsSummaryGeneratedAt: expect.any(String),
      }),
    )
  })

  it('regenerates a completed fixture set summary from an existing string text path', async () => {
    const fixtureSet = {
      id: 'week-1',
      path: fixtureSetPath,
      description: 'Week 1',
      date: '2026-05-31',
      start: '19:30',
      resultsSummary: '/text/summary-existing/',
    }
    const existingSummary = {
      id: 'summary-existing',
      path: 'text/summary-existing',
      text: 'Old summary',
      mimeType: 'text/markdown',
    }
    const fixture = {
      id: 'fixture-1',
      path: fixturePath('fixture-1'),
      home: { id: 'team-a', path: 'team/team-a' },
      away: { id: 'team-b', path: 'team/team-b' },
      result: { homeScore: 43, awayScore: 42 },
    }

    mocks.load.mockImplementation(async (pathish) => {
      const path = typeof pathish === 'string' ? pathish : pathish.path
      if (path === fixtureSetPath) return fixtureSet
      if (path === 'season/season-1/competition/league') {
        return { id: 'league', path, _name: 'league' }
      }
      if (path === 'team/team-a') return { id: 'team-a', path }
      if (path === 'team/team-b') return { id: 'team-b', path }
      if (path === 'text/summary-existing') return existingSummary
      return undefined
    })
    mocks.list.mockImplementation(async (type, parent) => {
      if (type === 'fixture' && parent === fixtureSetPath) return [fixture]
      if (type === 'report') return []
      return []
    })
    mocks.generateFixtureSetResultsSummary.mockResolvedValue({
      text: 'Updated summary.',
      model: 'gemini-test',
    })

    await expect(regenerateFixtureSetResultsSummary(fixtureSetPath)).resolves.toBe(fixtureSet)

    expect(mocks.generateFixtureSetResultsSummary).toHaveBeenCalledWith(
      expect.objectContaining({
        competitionName: 'league',
        fixtures: [
          expect.objectContaining({
            homeTeam: 'team-a',
            awayTeam: 'team-b',
          }),
        ],
      }),
    )
    expect(mocks.save).toHaveBeenCalledWith({
      ...existingSummary,
      text: 'Updated summary.',
      mimeType: 'text/markdown',
    })
  })

  it('rejects summary regeneration when Gemini returns empty text for a completed fixture set', async () => {
    const fixtureSet = {
      id: 'week-1',
      path: fixtureSetPath,
      description: 'Week 1',
      date: '2026-05-31',
      start: '19:30',
    }
    const fixture = {
      id: 'fixture-1',
      path: fixturePath('fixture-1'),
      home: { id: 'team-a', path: 'team/team-a' },
      away: { id: 'team-b', path: 'team/team-b' },
      result: { homeScore: 43, awayScore: 42 },
    }

    mocks.load.mockImplementation(async (pathish) => {
      const path = typeof pathish === 'string' ? pathish : pathish.path
      if (path === fixtureSetPath) return fixtureSet
      if (path === 'season/season-1/competition/league') {
        return { id: 'league', path, name: 'League', _name: 'league' }
      }
      if (path === 'team/team-a') return { id: 'team-a', path, name: 'Alpha' }
      if (path === 'team/team-b') return { id: 'team-b', path, name: 'Bravo' }
      return undefined
    })
    mocks.list.mockImplementation(async (type, parent) => {
      if (type === 'fixture' && parent === fixtureSetPath) return [fixture]
      if (type === 'report') return []
      return []
    })
    mocks.generateFixtureSetResultsSummary.mockResolvedValue(undefined)

    await expect(regenerateFixtureSetResultsSummary(fixtureSetPath)).rejects.toThrow(
      'Gemini did not return a fixture set results summary',
    )
    expect(mocks.save).not.toHaveBeenCalledWith(fixtureSet)
  })

  it('rejects summary regeneration for missing, empty, or incomplete fixture sets', async () => {
    mocks.load.mockResolvedValueOnce(undefined)

    await expect(regenerateFixtureSetResultsSummary(fixtureSetPath)).rejects.toThrow(
      `Fixture set not found: ${fixtureSetPath}`,
    )

    mocks.load.mockResolvedValueOnce({ id: 'week-1', path: fixtureSetPath })
    mocks.list.mockResolvedValueOnce([])

    await expect(regenerateFixtureSetResultsSummary(fixtureSetPath)).rejects.toThrow(
      'Cannot generate a results summary for an empty fixture set',
    )

    mocks.load.mockResolvedValueOnce({ id: 'week-1', path: fixtureSetPath })
    mocks.list.mockResolvedValueOnce([{ id: 'fixture-1', path: fixturePath('fixture-1') }])

    await expect(regenerateFixtureSetResultsSummary(fixtureSetPath)).rejects.toThrow(
      'Cannot generate a results summary until all fixtures have results',
    )
  })

  it('queues a full season statistics recalculation for the loaded season', async () => {
    const queueMicrotaskSpy = vi
      .spyOn(globalThis, 'queueMicrotask')
      .mockImplementation((callback: () => void) => callback())
    const season = { id: 'season-1', path: 'season/season-1' }
    mocks.load.mockResolvedValue(season)

    await statsRegenerate('season-1')

    expect(mocks.load).toHaveBeenCalledWith('season/season-1')
    expect(queueMicrotaskSpy).toHaveBeenCalledWith(expect.any(Function))
    expect(mocks.calculateStats).toHaveBeenCalledWith(season)

    queueMicrotaskSpy.mockRestore()
  })
})
