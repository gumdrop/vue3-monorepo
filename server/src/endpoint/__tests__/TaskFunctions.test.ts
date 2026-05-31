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
  uppdateForFixture: vi.fn(),
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
  calculateStats: vi.fn(),
  uppdateForFixture: mocks.uppdateForFixture,
}))

import { resultSubmission } from '../TaskFunctions'

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
})
