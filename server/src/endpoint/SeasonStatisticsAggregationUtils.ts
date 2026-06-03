import {
  Competition,
  CompetitionStatistics,
  CompetitionStatisticsResult,
  Entity,
  Fixture,
  Fixtures,
  LeagueTable,
  LeagueTableRow,
  LeagueTableSnapshot,
  parseParent,
  PathAndId,
  recalculateTables,
  Season,
  SeasonStatisticsAggregation,
  Team,
} from '@quizleague/shared'
import { docRef, entityPath, list, load, save } from '../storage/Storage'

const teamCompetitionTypes = new Set(['league', 'cup', 'subsidiary'])

export async function updateAggregationForCompletedFixtureSet(fixtureSetPath: string) {
  const fixtureSet = await load<Fixtures>(fixtureSetPath)
  if (!fixtureSet) return undefined

  const fixtures = await list<Fixture>('fixture', fixtureSet.path)
  if (fixtures.length === 0 || fixtures.some((fixture) => !fixture.result)) return undefined

  const competition = await load<Competition>(parseParent(fixtureSet.path))
  if (!competition || !isTeamCompetition(competition)) return undefined

  const season = await load<Season>(parseParent(competition.path))
  if (!season) return undefined

  return recalculateSeasonStatisticsAggregation(season)
}

export async function recalculateSeasonStatisticsAggregation(season: Season) {
  const competitions = (await list<Competition>('competition', season.path))
    .filter(isTeamCompetition)
    .sort((left, right) => left.name.localeCompare(right.name))

  const aggregation: SeasonStatisticsAggregation = {
    id: season.id,
    path: entityPath('seasonstatisticsaggregation', season.id),
    season: docRef(season),
    generatedAt: new Date().toISOString(),
    competitions: [],
  }

  for (const competition of competitions) {
    const competitionAggregation = await calculateCompetitionAggregation(competition)
    if (!competitionAggregation) continue

    aggregation.competitions.push(competitionAggregation)
    if (competitionAggregation.complete && competitionAggregation.winner) {
      await upsertCompetitionStatisticsWinner(
        season,
        competition,
        competitionAggregation.winner,
        competitionAggregation.winnerText,
      )
    }
  }

  await save(aggregation)
  return aggregation
}

async function calculateCompetitionAggregation(competition: Competition) {
  const fixtureSets = (await list<Fixtures>('fixtures', competition.path)).sort((left, right) =>
    left.date.localeCompare(right.date),
  )
  if (fixtureSets.length === 0) return undefined

  let tables = emptyTables(await list<LeagueTable>('leaguetable', competition.path))
  const tableSnapshots: LeagueTableSnapshot[] = []
  const scores = new ScoreAccumulator()
  let completedFixtureSetCount = 0
  let lastCompletedFixtures: Fixture[] = []

  for (const fixtureSet of fixtureSets) {
    const fixtures = await list<Fixture>('fixture', fixtureSet.path)
    if (fixtures.length === 0 || fixtures.some((fixture) => !fixture.result)) continue

    completedFixtureSetCount += 1
    lastCompletedFixtures = fixtures
    scores.addFixtures(fixtures)

    if (tables.length > 0) {
      tables = recalculateTables(tables, fixtures)
      tableSnapshots.push(snapshotTables(fixtureSet, tables))
    }
  }

  const complete = completedFixtureSetCount === fixtureSets.length
  const winner = complete ? winnerFromCompetition(tables, lastCompletedFixtures) : undefined
  const winnerText = winner ? await teamText(winner) : undefined

  return {
    competition: docRef(competition),
    competitionName: competition.name,
    fixtureSetCount: fixtureSets.length,
    completedFixtureSetCount,
    fixtureCount: scores.fixtureCount,
    complete,
    averageScore: scores.averageScore(),
    averageWinningScore: scores.averageWinningScore(),
    averageLosingScore: scores.averageLosingScore(),
    tableSnapshots,
    ...(winner ? { winner: docRef(winner) } : {}),
    ...(winnerText ? { winnerText } : {}),
  }
}

function isTeamCompetition(competition: Competition) {
  return teamCompetitionTypes.has(competition._name)
}

function emptyTables(tables: LeagueTable[]): LeagueTable[] {
  return tables.map((table) => ({
    ...table,
    rows: table.rows.map((row) => ({
      ...row,
      drawn: 0,
      leaguePoints: 0,
      lost: 0,
      matchPointsAgainst: 0,
      matchPointsFor: 0,
      played: 0,
      position: '',
      won: 0,
    })),
  }))
}

function snapshotTables(fixtureSet: Fixtures, tables: LeagueTable[]): LeagueTableSnapshot {
  return {
    fixtures: docRef(fixtureSet),
    fixtureSetDescription: fixtureSet.description,
    fixtureSetDate: fixtureSet.date,
    tables: tables.map((table) => ({
      table: docRef(table),
      description: table.description,
      rows: table.rows.map(snapshotRow),
    })),
  }
}

function snapshotRow(row: LeagueTableRow): LeagueTableRow {
  return {
    ...row,
    team: docRef(row.team),
  }
}

function winnerFromCompetition(tables: LeagueTable[], lastCompletedFixtures: Fixture[]) {
  const tableWinner = winnerFromTables(tables)
  if (tableWinner) return tableWinner

  return winnerFromFixtureSet(lastCompletedFixtures)
}

function winnerFromTables(tables: LeagueTable[]) {
  if (tables.length === 0) return undefined

  const topRows = tables.flatMap((table) =>
    table.rows.filter((row, index) => row.position === '1' || (!row.position && index === 0)),
  )
  return topRows.length === 1 ? topRows[0].team : undefined
}

function winnerFromFixtureSet(fixtures: Fixture[]) {
  const winners = fixtures
    .map((fixture) => {
      const result = fixture.result
      if (!result || result.homeScore === result.awayScore) return undefined

      return result.homeScore > result.awayScore ? fixture.home : fixture.away
    })
    .filter((winner): winner is PathAndId<Team> => Boolean(winner))

  const uniqueWinnerIds = new Set(winners.map((winner) => winner.id))
  return uniqueWinnerIds.size === 1 ? winners[0] : undefined
}

async function teamText(teamRef: PathAndId<Team>) {
  const team = await load<Team>(teamRef)
  return team?.name ?? team?.shortName ?? teamRef.id
}

async function upsertCompetitionStatisticsWinner(
  season: Season,
  competition: Competition,
  winner: PathAndId<Team>,
  winnerText = winner.id,
) {
  const entries = await list<CompetitionStatistics>('competitionstatistics')
  const entry =
    entries.find((candidate) => referencesCompetition(candidate, competition.path)) ??
    entries.find((candidate) => candidate.competitionName === competition.name) ??
    newCompetitionStatisticsEntry(competition)

  const result: CompetitionStatisticsResult = {
    competition: docRef(competition),
    season: docRef(season),
    seasonText: seasonText(season),
    team: docRef(winner),
    teamText: winnerText,
  }

  const results = entry.results.filter(
    (existingResult) => !sameCompetitionSeasonResult(existingResult, competition.path, season.path),
  )

  await save({
    ...entry,
    results: [...results, result].sort((left, right) =>
      left.seasonText.localeCompare(right.seasonText),
    ),
  })
}

function referencesCompetition(entry: CompetitionStatistics, competitionPath: string) {
  return entry.results.some((result) => referencePath(result.competition) === competitionPath)
}

function sameCompetitionSeasonResult(
  result: CompetitionStatisticsResult,
  competitionPath: string,
  seasonPath: string,
) {
  const resultSeasonPath = referencePath(result.season)
  if (resultSeasonPath !== seasonPath) return false

  const resultCompetitionPath = referencePath(result.competition)
  return !resultCompetitionPath || resultCompetitionPath === competitionPath
}

function newCompetitionStatisticsEntry(competition: Competition): CompetitionStatistics {
  const id = `competition-statistics-${slug(competition.id || competition.name)}`
  return {
    id,
    path: entityPath('competitionstatistics', id),
    competitionName: competition.name,
    results: [],
  }
}

function seasonText(season: Season) {
  return season.startYear && season.endYear ? `${season.startYear}/${season.endYear}` : season.id
}

function slug(value: string) {
  return (
    value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'competition'
  )
}

function referencePath(value: unknown) {
  if (!value) return ''
  if (typeof value === 'string') return value.replace(/^\/+|\/+$/g, '')
  if (typeof value !== 'object') return ''

  const candidate = value as Partial<PathAndId<Entity>> & {
    typeName?: string
    key?: { parentKey?: string }
  }
  if (typeof candidate.path === 'string') return candidate.path.replace(/^\/+|\/+$/g, '')
  if (candidate.typeName && candidate.id) {
    const parent = candidate.key?.parentKey ? `${candidate.key.parentKey}/` : ''
    return `${parent}${candidate.typeName}/${candidate.id}`.replace(/^\/+|\/+$/g, '')
  }

  return ''
}

class ScoreAccumulator {
  fixtureCount = 0
  private scoreCount = 0
  private totalScore = 0
  private winningScoreCount = 0
  private totalWinningScore = 0
  private losingScoreCount = 0
  private totalLosingScore = 0

  addFixtures(fixtures: Fixture[]) {
    fixtures.forEach((fixture) => this.addFixture(fixture))
  }

  averageScore() {
    return average(this.totalScore, this.scoreCount)
  }

  averageWinningScore() {
    return average(this.totalWinningScore, this.winningScoreCount)
  }

  averageLosingScore() {
    return average(this.totalLosingScore, this.losingScoreCount)
  }

  private addFixture(fixture: Fixture) {
    const result = fixture.result
    if (!result) return

    this.fixtureCount += 1
    this.scoreCount += 2
    this.totalScore += result.homeScore + result.awayScore

    if (result.homeScore === result.awayScore) return

    this.winningScoreCount += 1
    this.losingScoreCount += 1
    this.totalWinningScore += Math.max(result.homeScore, result.awayScore)
    this.totalLosingScore += Math.min(result.homeScore, result.awayScore)
  }
}

function average(total: number, count: number) {
  return count ? total / count : 0
}
