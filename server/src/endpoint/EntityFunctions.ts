import { Fixture, Fixtures, LeagueTable, parseParent, recalculateTables } from '@quizleague/shared'
import { entityPath, list, load, saveAll } from '../storage/Storage'
import { statsRegenerate } from './TaskFunctions'

export function regenerateStats(seasonId: string) {
  statsRegenerate(seasonId)
}

export async function recalculateTable(path: string) {
  const table = await load<LeagueTable>(entityPath('leaguetable', path))
  const fixtureSets = await list<Fixtures>('fixtures', parseParent(path))
  let fixtureLists: Fixture[] = []
  for (const fixtures of fixtureSets) {
    fixtureLists = [...fixtureLists, ...(await list<Fixture>('fixture', fixtures.path))]
  }

  const blankTable = {
    ...table,
    rows: table.rows.map((row) => ({
      ...row,
      won: 0,
      drawn: 0,
      leaguePoints: 0,
      matchPointsFor: 0,
      matchPointsAgainst: 0,
      played: 0,
    })),
  }
  const recalcTable = recalculateTables([blankTable], fixtureLists)
  saveAll(recalcTable)
}
