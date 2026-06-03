import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  recalculateSeasonStatisticsAggregation,
  updateAggregationForCompletedFixtureSet,
} from '../SeasonStatisticsAggregationUtils'
import { list, load, save } from '../../storage/Storage'

vi.mock('../../storage/Storage', () => ({
  docRef: vi.fn((pathish) => ({
    id: typeof pathish === 'string' ? pathish.split('/').pop() : pathish.id,
    path: typeof pathish === 'string' ? pathish : pathish.path,
  })),
  entityPath: vi.fn((type: string, id: string) => `${type}/${id}`),
  list: vi.fn(),
  load: vi.fn(),
  save: vi.fn(),
}))

const season = {
  id: 'season-1',
  path: 'season/season-1',
  startYear: 2025,
  endYear: 2026,
}
const league = {
  id: 'league',
  path: 'season/season-1/competition/league',
  name: 'League',
  _name: 'league',
}
const singleton = {
  id: 'individual',
  path: 'season/season-1/competition/individual',
  name: 'Individual Quiz',
  _name: 'singleton',
}
const table = {
  id: 'league-table',
  path: 'season/season-1/competition/league/leaguetable/league-table',
  description: 'League Table',
  rows: ['team-a', 'team-b', 'team-c', 'team-d'].map((teamId) => ({
    team: { id: teamId, path: `team/${teamId}` },
    position: '',
    played: 0,
    won: 0,
    lost: 0,
    drawn: 0,
    leaguePoints: 0,
    matchPointsFor: 0,
    matchPointsAgainst: 0,
  })),
}
const weekOne = {
  id: 'week-1',
  path: 'season/season-1/competition/league/fixtures/week-1',
  description: 'Week 1',
  date: '2026-01-01',
  start: '20:00:00',
}
const weekTwo = {
  id: 'week-2',
  path: 'season/season-1/competition/league/fixtures/week-2',
  description: 'Week 2',
  date: '2026-01-08',
  start: '20:00:00',
}
const fixtures = {
  [weekOne.path]: [
    fixture('fixture-1', weekOne.path, 'team-a', 'team-b', 40, 35),
    fixture('fixture-2', weekOne.path, 'team-c', 'team-d', 33, 33),
  ],
  [weekTwo.path]: [
    fixture('fixture-3', weekTwo.path, 'team-a', 'team-c', 42, 39),
    fixture('fixture-4', weekTwo.path, 'team-b', 'team-d', 41, 40),
  ],
}

function fixture(
  id: string,
  fixtureSetPath: string,
  homeId: string,
  awayId: string,
  homeScore: number,
  awayScore: number,
) {
  return {
    id,
    path: `${fixtureSetPath}/fixture/${id}`,
    home: { id: homeId, path: `team/${homeId}` },
    away: { id: awayId, path: `team/${awayId}` },
    result: { homeScore, awayScore },
  }
}

describe('SeasonStatisticsAggregationUtils', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(save).mockImplementation(async (entity) => entity as never)
    vi.mocked(load).mockImplementation(async (pathish) => {
      const path = typeof pathish === 'string' ? pathish : pathish.path
      if (path === season.path) return season as never
      if (path === league.path) return league as never
      if (path === weekOne.path) return weekOne as never
      if (path === 'team/team-a') {
        return { id: 'team-a', path, name: 'Alpha' } as never
      }
      return undefined as never
    })
    vi.mocked(list).mockImplementation(async (type, parent) => {
      if (type === 'competition' && parent === season.path) {
        return [league, singleton] as never
      }
      if (type === 'fixtures' && parent === league.path) {
        return [weekTwo, weekOne] as never
      }
      if (type === 'leaguetable' && parent === league.path) {
        return [table] as never
      }
      if (type === 'fixture') {
        return (fixtures[parent as keyof typeof fixtures] ?? []) as never
      }
      if (type === 'competitionstatistics') return [] as never
      return [] as never
    })
  })

  it('stores completed fixture-set table snapshots, score averages, and a winner', async () => {
    await recalculateSeasonStatisticsAggregation(season as never)

    const savedAggregation = vi
      .mocked(save)
      .mock.calls.map(([entity]) => entity as any)
      .find((entity) => entity.path === 'seasonstatisticsaggregation/season-1')

    expect(savedAggregation).toEqual(
      expect.objectContaining({
        id: 'season-1',
        season: { id: 'season-1', path: 'season/season-1' },
        competitions: [
          expect.objectContaining({
            competitionName: 'League',
            fixtureSetCount: 2,
            completedFixtureSetCount: 2,
            fixtureCount: 4,
            complete: true,
            averageScore: 37.875,
            averageWinningScore: 41,
            averageLosingScore: 38,
            winner: { id: 'team-a', path: 'team/team-a' },
            winnerText: 'Alpha',
          }),
        ],
      }),
    )

    const leagueAggregation = savedAggregation.competitions[0]
    expect(leagueAggregation.tableSnapshots).toHaveLength(2)
    expect(leagueAggregation.tableSnapshots[0]).toEqual(
      expect.objectContaining({
        fixtureSetDescription: 'Week 1',
        fixtureSetDate: '2026-01-01',
      }),
    )
    expect(leagueAggregation.tableSnapshots[0].tables[0].rows[0]).toEqual(
      expect.objectContaining({
        team: { id: 'team-a', path: 'team/team-a' },
        position: '1',
        played: 1,
        won: 1,
      }),
    )

    const savedCompetitionStatistics = vi
      .mocked(save)
      .mock.calls.map(([entity]) => entity as any)
      .find((entity) => entity.path === 'competitionstatistics/competition-statistics-league')
    expect(savedCompetitionStatistics).toEqual(
      expect.objectContaining({
        competitionName: 'League',
        results: [
          {
            competition: { id: 'league', path: 'season/season-1/competition/league' },
            season: { id: 'season-1', path: 'season/season-1' },
            seasonText: '2025/2026',
            team: { id: 'team-a', path: 'team/team-a' },
            teamText: 'Alpha',
          },
        ],
      }),
    )
  })

  it('recalculates the season aggregation when a completed fixture set is updated', async () => {
    await updateAggregationForCompletedFixtureSet(weekOne.path)

    expect(save).toHaveBeenCalledWith(
      expect.objectContaining({
        path: 'seasonstatisticsaggregation/season-1',
      }),
    )
  })

  it('does not recalculate from an incomplete fixture set', async () => {
    vi.mocked(list).mockImplementation(async (type, parent) => {
      if (type === 'fixture' && parent === weekOne.path) {
        return [{ ...fixtures[weekOne.path][0], result: undefined }] as never
      }
      return [] as never
    })

    await updateAggregationForCompletedFixtureSet(weekOne.path)

    expect(save).not.toHaveBeenCalled()
  })
})
