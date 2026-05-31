import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  docRef: vi.fn((entity) => ({
    id: typeof entity === 'string' ? entity.split('/').pop() : entity.id,
    path: typeof entity === 'string' ? entity : entity.path,
  })),
  generateFixtureSetResultsSummary: vi.fn(),
  list: vi.fn(),
  load: vi.fn(),
  save: vi.fn(),
  saveAll: vi.fn(),
  calculateStats: vi.fn(),
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
  generateFixtureSetResultsSummary: mocks.generateFixtureSetResultsSummary,
}))

vi.mock('../StatisticsUtils', () => ({
  calculateStats: mocks.calculateStats,
  updateForFixture: mocks.updateForFixture,
}))

import {
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
    const user = { id: 'user-1', path: 'user/user-1' }
    const teamA = {
      id: 'team-a',
      path: 'team/team-a',
      name: 'Alpha',
      shortName: 'Alpha',
      users: [user],
    }
    const teamB = {
      id: 'team-b',
      path: 'team/team-b',
      name: 'Bravo',
      shortName: 'Bravo',
      users: [],
    }
    const teamC = {
      id: 'team-c',
      path: 'team/team-c',
      name: 'Charlie',
      shortName: 'Charlie',
      users: [],
    }
    const teamD = {
      id: 'team-d',
      path: 'team/team-d',
      name: 'Delta',
      shortName: 'Delta',
      users: [],
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
  })

  it('does not generate a summary while any fixture in the set is missing a result', async () => {
    const user = { id: 'user-1', path: 'user/user-1' }
    const teamA = {
      id: 'team-a',
      path: 'team/team-a',
      users: [user],
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
  })

  it('leaves completed fixture set summaries unchanged when Gemini returns empty text', async () => {
    const user = { id: 'user-1', path: 'user/user-1' }
    const teamA = {
      id: 'team-a',
      path: 'team/team-a',
      users: [user],
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
