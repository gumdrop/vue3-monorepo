import { beforeEach, describe, expect, it, vi } from 'vitest'
import { recalculateTables } from '@quizleague/shared'
import { recalculateTable, regenerateStats } from '../EntityFunctions'
import { statsRegenerate } from '../TaskFunctions'
import { list, load, saveAll } from '../../storage/Storage'

vi.mock('../TaskFunctions', () => ({
  statsRegenerate: vi.fn(),
}))

vi.mock('../../storage/Storage', () => ({
  entityPath: vi.fn((type: string, id: string) => `${type}/${id}`),
  list: vi.fn(),
  load: vi.fn(),
  saveAll: vi.fn(),
}))

vi.mock('@quizleague/shared', async () => {
  const actual = (await vi.importActual('@quizleague/shared')) as object
  return {
    ...actual,
    recalculateTables: vi.fn((_tables, _fixtures) => [
      {
        id: 'table-1',
        path: 'season/season-1/competition/league/leaguetable/table-1',
        rows: [{ team: { id: 'team-1', path: 'team/team-1' }, played: 1 }],
      },
    ]),
  }
})

describe('EntityFunctions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('queues statistics regeneration for the requested season', () => {
    regenerateStats('season-1')

    expect(statsRegenerate).toHaveBeenCalledWith('season-1')
  })

  it('recalculates a table from all fixture sets under the table parent', async () => {
    const path = 'season/season-1/competition/league/leaguetable/table-1'
    const table = {
      id: 'table-1',
      path,
      rows: [
        {
          team: { id: 'team-1', path: 'team/team-1' },
          won: 4,
          drawn: 1,
          leaguePoints: 9,
          matchPointsFor: 120,
          matchPointsAgainst: 110,
          played: 5,
        },
      ],
    }
    const fixtureSet = {
      id: 'week-1',
      path: 'season/season-1/competition/league/fixtures/week-1',
    }
    const fixture = {
      id: 'fixture-1',
      path: `${fixtureSet.path}/fixture/fixture-1`,
      result: { homeScore: 44, awayScore: 41 },
    }
    vi.mocked(load).mockResolvedValue(table as never)
    vi.mocked(list).mockImplementation(async (type, parent) => {
      if (type === 'fixtures' && parent === 'season/season-1/competition/league') {
        return [fixtureSet] as never
      }
      if (type === 'fixture' && parent === fixtureSet.path) {
        return [fixture] as never
      }
      return [] as never
    })

    await recalculateTable(path)

    expect(load).toHaveBeenCalledWith(`leaguetable/${path}`)
    expect(recalculateTables).toHaveBeenCalledWith(
      [
        {
          ...table,
          rows: [
            {
              ...table.rows[0],
              won: 0,
              drawn: 0,
              leaguePoints: 0,
              matchPointsFor: 0,
              matchPointsAgainst: 0,
              played: 0,
            },
          ],
        },
      ],
      [fixture],
    )
    expect(saveAll).toHaveBeenCalledWith([
      {
        id: 'table-1',
        path,
        rows: [{ team: { id: 'team-1', path: 'team/team-1' }, played: 1 }],
      },
    ])
  })
})
