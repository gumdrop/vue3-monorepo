import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  collectionWhere: vi.fn(),
  collection: vi.fn(),
  deleteAll: vi.fn(),
  list: vi.fn(),
  load: vi.fn(),
  runQuery: vi.fn(),
  save: vi.fn(),
  saveAll: vi.fn(),
}))

vi.mock('../../storage/Storage', () => ({
  collection: mocks.collection,
  deleteAll: mocks.deleteAll,
  entityPath: vi.fn((type: string, id: string) => `${type}/${id}`),
  list: mocks.list,
  load: mocks.load,
  runQuery: mocks.runQuery,
  save: mocks.save,
  saveAll: mocks.saveAll,
}))

import {
  rebuildSeasonResultIndex,
  upsertResultIndexForCompletedFixtureSet,
} from '../ResultIndexUtils'

const season = { id: 'season-1', path: 'season/season-1' }
const competition = {
  id: 'league',
  path: 'season/season-1/competition/league',
  name: 'League',
  _name: 'league',
}
const fixtureSet = {
  id: 'week-1',
  path: 'season/season-1/competition/league/fixtures/week-1',
  description: 'Week 1',
  date: '2026-05-31',
  start: '19:30',
}
const completedFixture = {
  id: 'fixture-1',
  path: `${fixtureSet.path}/fixture/fixture-1`,
  home: { id: 'team-a', path: 'team/team-a' },
  away: { id: 'team-b', path: 'team/team-b' },
  result: { homeScore: 43, awayScore: 42 },
}

describe('ResultIndexUtils', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.collectionWhere.mockReturnValue('result-index-query')
    mocks.collection.mockReturnValue({ where: mocks.collectionWhere })
    mocks.deleteAll.mockResolvedValue(undefined)
    mocks.runQuery.mockResolvedValue([])
    mocks.save.mockResolvedValue(undefined)
    mocks.saveAll.mockResolvedValue(undefined)
    mocks.load.mockImplementation(async (path: string) => {
      if (path === competition.path) return competition
      if (path === season.path) return season
      return undefined
    })
  })

  it('writes one result index document for a completed fixture set', async () => {
    await upsertResultIndexForCompletedFixtureSet(fixtureSet, [completedFixture])

    expect(mocks.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: encodeURIComponent(fixtureSet.path),
        path: `resultindex/${encodeURIComponent(fixtureSet.path)}`,
        seasonId: 'season-1',
        competitionPath: competition.path,
        firstClass: true,
        fixtureSetPath: fixtureSet.path,
        fixtureSetDate: '2026-05-31',
        teamIds: ['team-a', 'team-b'],
        fixtures: [
          {
            fixturePath: completedFixture.path,
            homeTeamId: 'team-a',
            homeTeamPath: 'team/team-a',
            awayTeamId: 'team-b',
            awayTeamPath: 'team/team-b',
            homeScore: 43,
            awayScore: 42,
          },
        ],
      }),
    )
  })

  it('rebuilds a season result index from completed fixture sets only', async () => {
    const incompleteFixtureSet = {
      ...fixtureSet,
      id: 'week-2',
      path: 'season/season-1/competition/league/fixtures/week-2',
    }
    mocks.runQuery.mockResolvedValue([{ id: 'old', path: 'resultindex/old' }])
    mocks.list.mockImplementation(async (type: string, parent: string) => {
      if (type === 'competition' && parent === season.path) return [competition]
      if (type === 'fixtures' && parent === competition.path)
        return [fixtureSet, incompleteFixtureSet]
      if (type === 'fixture' && parent === fixtureSet.path) return [completedFixture]
      if (type === 'fixture' && parent === incompleteFixtureSet.path) {
        return [
          {
            ...completedFixture,
            path: `${incompleteFixtureSet.path}/fixture/fixture-2`,
            result: undefined,
          },
        ]
      }
      return []
    })

    await expect(rebuildSeasonResultIndex(season)).resolves.toEqual(
      expect.objectContaining({
        seasonId: 'season-1',
        fixtureSetCount: 1,
      }),
    )

    expect(mocks.collectionWhere).toHaveBeenCalledWith('seasonId', '==', 'season-1')
    expect(mocks.deleteAll).toHaveBeenCalledWith([{ id: 'old', path: 'resultindex/old' }])
    expect(mocks.saveAll).toHaveBeenCalledWith([
      expect.objectContaining({ fixtureSetPath: fixtureSet.path }),
    ])
    expect(mocks.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'season-1',
        path: 'resultindexstatus/season-1',
        seasonId: 'season-1',
        fixtureSetCount: 1,
      }),
    )
  })
})
