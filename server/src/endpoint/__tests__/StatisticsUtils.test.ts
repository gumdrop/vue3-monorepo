import { describe, it, expect, vi, beforeEach } from 'vitest'
import { calculateStats, updateForFixture } from '../StatisticsUtils'

// Mock Storage
vi.mock('../../storage/Storage', () => ({
  deleteAll: vi.fn(),
  docRef: vi.fn((path) => ({
    id: typeof path === 'string' ? path.split('/').pop() : path.id,
    path: typeof path === 'string' ? path : path.path,
  })),
  entityPath: vi.fn((type, id) => `${type}/${id}`),
  list: vi.fn(),
  load: vi.fn(),
  saveAll: vi.fn(),
}))

vi.mock('@quizleague/shared', async () => {
  const actual = (await vi.importActual('@quizleague/shared')) as typeof import('@quizleague/shared')
  return {
    ...actual,
    recalculateTables: vi.fn(actual.recalculateTables),
  }
})

import { list, load, saveAll } from '../../storage/Storage'

const tableRow = (teamId: string, position = '') => ({
  team: { id: teamId, path: `team/${teamId}` },
  position,
  played: 0,
  won: 0,
  drawn: 0,
  lost: 0,
  leaguePoints: 0,
  matchPointsAgainst: 0,
  matchPointsFor: 0,
})

describe('StatisticsUtils', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calculateStats should calculate league position', async () => {
    const season = { id: 's1', path: 'season/s1' }
    const competition = { id: 'c1', path: 'competition/c1', _name: 'league' }
    const table = {
      id: 't1',
      path: 'leaguetable/t1',
      rows: [tableRow('team1'), tableRow('team2')],
    }
    const fixtures = {
      id: 'fs1',
      path: 'fixtures/fs1',
      date: '2023-01-01',
    }
    const fixture = {
      id: 'f1',
      path: 'fixture/f1',
      home: { id: 'team1', path: 'team/team1' },
      away: { id: 'team2', path: 'team/team2' },
      result: { homeScore: 10, awayScore: 5 },
    }

    vi.mocked(list).mockImplementation((type, path) => {
      if (type === 'statistics') return Promise.resolve([])
      if (type === 'competition') return Promise.resolve([competition])
      if (type === 'leaguetable') return Promise.resolve([table])
      if (type === 'fixtures') return Promise.resolve([fixtures])
      if (type === 'fixture') return Promise.resolve([fixture])
      return Promise.resolve([])
    })

    await calculateStats(season as any)

    expect(saveAll).toHaveBeenCalled()
    const savedStats = vi.mocked(saveAll).mock.calls[0][0] as any[]

    expect(savedStats.length).toBeGreaterThan(0)

    const team1Stats = savedStats.find((s) => s.team.id === 'team1')
    expect(team1Stats).toBeDefined()
    expect(team1Stats.seasonStats.currentLeaguePosition).toBe(1)

    const weekStats1 = Object.values(team1Stats.weekStats)[0] as any
    expect(weekStats1.leaguePosition).toBe(1)

    const team2Stats = savedStats.find((s) => s.team.id === 'team2')
    expect(team2Stats).toBeDefined()
    expect(team2Stats.seasonStats.currentLeaguePosition).toBe(2)

    const weekStats2 = Object.values(team2Stats.weekStats)[0] as any
    expect(weekStats2.leaguePosition).toBe(2)
  })

  it('updateForFixture updates both teams and untouched table teams for the fixture date', async () => {
    const season = { id: 's1', path: 'season/s1' }
    const fixtures = {
      id: 'fs1',
      path: 'season/s1/competition/league/fixtures/fs1',
      date: '2023-02-01',
    }
    const competition = { id: 'league', path: 'season/s1/competition/league', _name: 'league' }
    const table = {
      id: 't1',
      path: 'season/s1/competition/league/leaguetable/t1',
      rows: [
        tableRow('team1', '2'),
        tableRow('team2', '1'),
        tableRow('team3', '3'),
      ],
    }
    const fixture = {
      id: 'f1',
      path: `${fixtures.path}/fixture/f1`,
      home: { id: 'team1', path: 'team/team1' },
      away: { id: 'team2', path: 'team/team2' },
      result: { homeScore: 4, awayScore: 4 },
    }

    vi.mocked(load).mockImplementation((path) => {
      if (path === fixtures.path) return Promise.resolve(fixtures as any)
      if (path === competition.path) return Promise.resolve(competition as any)
      return Promise.resolve(undefined)
    })
    vi.mocked(list).mockImplementation((type, path) => {
      if (type === 'statistics') return Promise.resolve([])
      if (type === 'competition') return Promise.resolve([competition] as any)
      if (type === 'leaguetable' && path === competition.path) return Promise.resolve([table] as any)
      return Promise.resolve([])
    })

    await updateForFixture(fixture as any, season as any)

    const savedStats = vi.mocked(saveAll).mock.calls[0][0] as any[]
    expect(savedStats).toHaveLength(3)
    expect(savedStats.map((stats) => stats.team.id).sort()).toEqual(['team1', 'team2', 'team3'])

    const team1Stats = savedStats.find((stats) => stats.team.id === 'team1')
    expect(team1Stats.weekStats['2023-02-01']).toEqual(
      expect.objectContaining({
        pointsFor: 4,
        pointsAgainst: 4,
        pointsDifference: 0,
        leaguePosition: 2,
      }),
    )
    expect(team1Stats.seasonStats.headToHead).toHaveLength(1)
    expect(team1Stats.seasonStats.headToHead[0]).toEqual(
      expect.objectContaining({
        team: { id: 'team2', path: 'team/team2' },
        win: 0,
        draw: 1,
      }),
    )
    expect(Math.abs(team1Stats.seasonStats.headToHead[0].lose)).toBe(0)

    const team3Stats = savedStats.find((stats) => stats.team.id === 'team3')
    expect(team3Stats.weekStats).toEqual({})
    expect(team3Stats.seasonStats.currentLeaguePosition).toBe(3)
  })

  it('records weekly league positions after all fixtures in the same fixture set are applied', async () => {
    const season = { id: 's1', path: 'season/s1' }
    const competition = { id: 'c1', path: 'season/s1/competition/league', _name: 'league' }
    const table = {
      id: 't1',
      path: 'season/s1/competition/league/leaguetable/t1',
      rows: [tableRow('alpha'), tableRow('bravo'), tableRow('charlie'), tableRow('delta')],
    }
    const fixtures = {
      id: 'fs1',
      path: 'season/s1/competition/league/fixtures/fs1',
      date: '2025-03-18',
    }
    const alphaFixture = {
      id: 'fixture-alpha',
      path: `${fixtures.path}/fixture/fixture-alpha`,
      home: { id: 'alpha', path: 'team/alpha' },
      away: { id: 'bravo', path: 'team/bravo' },
      result: { homeScore: 10, awayScore: 0 },
    }
    const charlieFixture = {
      id: 'fixture-charlie',
      path: `${fixtures.path}/fixture/fixture-charlie`,
      home: { id: 'charlie', path: 'team/charlie' },
      away: { id: 'delta', path: 'team/delta' },
      result: { homeScore: 30, awayScore: 0 },
    }

    vi.mocked(list).mockImplementation((type, path) => {
      if (type === 'statistics') return Promise.resolve([])
      if (type === 'competition') return Promise.resolve([competition] as any)
      if (type === 'leaguetable' && path === competition.path) return Promise.resolve([table] as any)
      if (type === 'fixtures' && path === competition.path) return Promise.resolve([fixtures] as any)
      if (type === 'fixture' && path === fixtures.path) {
        return Promise.resolve([alphaFixture, charlieFixture] as any)
      }
      return Promise.resolve([])
    })

    await calculateStats(season as any)

    const savedStats = vi.mocked(saveAll).mock.calls[0][0] as any[]
    const alphaStats = savedStats.find((stats) => stats.team.id === 'alpha')
    const charlieStats = savedStats.find((stats) => stats.team.id === 'charlie')

    expect(alphaStats.weekStats['2025-03-18'].leaguePosition).toBe(2)
    expect(alphaStats.seasonStats.currentLeaguePosition).toBe(2)
    expect(charlieStats.weekStats['2025-03-18'].leaguePosition).toBe(1)
    expect(charlieStats.seasonStats.currentLeaguePosition).toBe(1)
  })
})
