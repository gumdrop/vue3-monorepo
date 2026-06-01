import { LocalDate } from '@js-joda/core'
import {
  Competition,
  Fixture,
  Fixtures,
  HeadToHead,
  LeagueTable,
  parseParent,
  PathAndId,
  recalculateTables,
  Season,
  SeasonStats,
  Statistics,
  Team,
  WeekStats,
} from '@quizleague/shared'
import { v4 as uuid } from 'uuid'
import { deleteAll, docRef, entityPath, list, load, saveAll } from '../storage/Storage'

export async function updateForFixture(fixture: Fixture, season: Season) {
  const fixtures = await load<Fixtures>(parseParent(fixture.path))
  const competition = await load<Competition>(parseParent(fixtures.path))
  const tables = await list<LeagueTable>('leaguetable', competition.path)
  const statistics = await seasonStats(season)
  const stats = await updateStats(
    fixture,
    LocalDate.parse(fixtures.date),
    season,
    tables,
    statistics,
  )

  saveAll(stats)
}

async function updateStats(
  fixture: Fixture,
  date: LocalDate,
  season: Season,
  tables: LeagueTable[],
  statistics: Statistics[],
) {
  const cache = new Map<string, Statistics>(statistics.map((s) => [s.team.id, s]))

  async function find(team: PathAndId<Team>): Promise<Statistics> {
    function seasonStats(): SeasonStats {
      return {
        currentLeaguePosition: 0,
        runningPointsAgainst: 0,
        runningPointsDifference: 0,
        runningPointsFor: 0,
        headToHead: [],
      }
    }

    const comp = await leagueComp(season)
    if (comp) {
      const exists = cache.has(team.id)
      if (!exists) {
        const tables = await list<LeagueTable>('leaguetable', comp.path)
        const table = tables.find((t) => t.rows.some((r) => r.team.id === team.id))
        if (table) {
          const id = uuid()
          cache.set(team.id, {
            id,
            team: docRef(team),
            season: docRef(season.path),
            table: docRef(table.path),
            weekStats: {},
            path: entityPath('statistics', id),
            seasonStats: seasonStats(),
          })
        }
      }
    }
    return cache.get(team.id)
  }

  if (fixture.result) {
    const hs = await find(fixture.home)
    const as = await find(fixture.away)
    const allStats: Statistics[] = []
    for (const t of tables) {
      for (const row of t.rows.filter(
        (row) => row.team.id != hs.team.id && row.team.id != as.team.id,
      )) {
        allStats.push(await find(row.team))
      }
    }

    const homeStats = addToHeadToHead(
      addWeekStats(
        hs,
        date,
        fixture.result?.homeScore,
        fixture.result?.awayScore,
        getPosition(hs.team.id, tables),
      ),
      fixture,
    )
    const awayStats = addToHeadToHead(
      addWeekStats(
        as,
        date,
        fixture.result?.awayScore,
        fixture.result?.homeScore,
        getPosition(as.team.id, tables),
      ),
      fixture,
    )

    return [homeStats, awayStats, ...allStats].map((s) => ({
      ...s,
      seasonStats: {
        ...s.seasonStats,
        currentLeaguePosition: getPosition(s.team.id, tables),
      },
    }))
  } else return statistics
}

function addWeekStats(
  stats: Statistics,
  date: LocalDate,
  pointsFor: number,
  pointsAgainst: number,
  leaguePosition: number,
) {
  const newStats: WeekStats = {
    date,
    pointsFor,
    pointsAgainst,
    pointsDifference: pointsFor - pointsAgainst,
    cumuPointsAgainst: 0,
    cumuPointsDifference: 0,
    cumuPointsFor: 0,
    leaguePosition,
    ignorable: false,
  }

  return updateFromCurrent(stats, newStats, pointsFor, pointsAgainst)
}

function updateFromCurrent(
  statistics: Statistics,
  stats: WeekStats,
  pointsFor,
  pointsAgainst,
): Statistics {
  const seasonStats = statistics.seasonStats

  const week = {
    ...stats,
    cumuPointsFor: seasonStats.runningPointsFor + pointsFor,
    cumuPointsAgainst: seasonStats.runningPointsAgainst + pointsAgainst,
    cumuPointsDifference: seasonStats.runningPointsDifference + stats.pointsDifference,
  }

  const season = {
    ...seasonStats,
    runningPointsFor: week.cumuPointsFor,
    runningPointsAgainst: week.cumuPointsAgainst,
    runningPointsDifference: week.cumuPointsDifference,
    currentLeaguePosition: week.leaguePosition,
  }

  return {
    ...statistics,
    seasonStats: season,
    weekStats: { ...statistics.weekStats, [week.date.toString()]: week },
  }
}

function getPosition(teamId: string, tables: LeagueTable[]): number {
  const row = tables.flatMap((t) => t.rows).find((r) => r.team.id === teamId)
  return row?.position ? parseInt(row.position) : 0
}

function addToHeadToHead(statistics: Statistics, fixture: Fixture) {
  if (fixture.result) {
    const r = fixture.result
    const otherTeam = [fixture.home, fixture.away].filter((f) => f.id !== statistics.team.id)[0]

    function getWLD() {
      const normalisedScores =
        fixture.home.id === otherTeam.id ? [r.awayScore, r.homeScore] : [r.homeScore, r.awayScore]
      const win = normalisedScores[0] > normalisedScores[1] ? 1 : 0
      const draw = normalisedScores[0] === normalisedScores[1] ? 1 : 0
      const lose = (win + draw - 1) * -1
      return { win, lose, draw }
    }

    const wld = getWLD()

    const headToHead: HeadToHead = {
      team: docRef(otherTeam),
      win: wld.win,
      lose: wld.lose,
      draw: wld.draw,
    }
    const existing = statistics.seasonStats.headToHead.find((s) => s.team.id === otherTeam.id)
    const combined: HeadToHead = !existing
      ? headToHead
      : {
          team: existing.team,
          win: headToHead.win + existing.win,
          lose: headToHead.lose + existing.lose,
          draw: headToHead.draw + existing.draw,
        }

    statistics.seasonStats.headToHead = [
      ...statistics.seasonStats.headToHead.filter((h) => h.team.id !== otherTeam.id),
      combined,
    ]
  }
  return statistics
}

async function leagueComp(season: Season) {
  const comps = await list<Competition>('competition', season.path)
  return comps.find((c) => c._name === 'league')
}

async function seasonStats(season: Season) {
  return (await list<Statistics>('statistics')).filter((stats) => stats.season.id === season.id)
}

export async function calculateStats(season: Season) {
  const ss = await list<Statistics>('statistics')
  const seasonStats = ss.filter((s) => s.season.id === season.id)
  await deleteAll(seasonStats)
  const c = await leagueComp(season)
  const tables = await list<LeagueTable>('leaguetable', c?.path)

  let dummyTables: LeagueTable[] = tables.map((t) => ({
    ...t,
    rows: t.rows.map((r) => ({
      ...r,
      drawn: 0,
      leaguePoints: 0,
      lost: 0,
      matchPointsAgainst: 0,
      matchPointsFor: 0,
      played: 0,
      won: 0,
      position: '',
    })),
  }))

  let startingStats: Statistics[] = []
  const fixtures = (await list<Fixtures>('fixtures', c?.path)).sort((a, b) =>
    a.date.localeCompare(b.date),
  )

  for (const f of fixtures) {
    const fixtureList = await list<Fixture>('fixture', f.path)

    for (const r of fixtureList) {
      dummyTables = recalculateTables(dummyTables, [r])
      startingStats = await updateStats(
        r,
        LocalDate.parse(f.date),
        season,
        dummyTables,
        startingStats,
      )
    }

    await saveAll(startingStats)
  }
}
