import {
  Competition,
  Fixture,
  Fixtures,
  LeagueTable,
  parseParent,
  recalculateTables,
  Report,
  Result,
  ResultsSubmitCommand,
  ResultValues,
  Season,
  SeasonStatisticsAggregation,
  LeagueTableRow,
  LeagueTableSnapshot,
  LeagueTableSnapshotTable,
  Team,
  Text,
  toPath,
  User,
} from '@quizleague/shared'
import { v4 as uuid } from 'uuid'
import { docRef, entityPath, list, load, save, saveAll } from '../storage/Storage'
import { currentSeason } from './util'
import { calculateStats, updateForFixture } from './StatisticsUtils'
import {
  generateCompetitionRoundup,
  generateFixtureSetResultsSummary,
  type CompetitionRoundupFixtureResult,
  type FixtureSetSummaryFixture,
} from './GeminiResultsSummary'
import { updateAggregationForCompletedFixtureSet } from './SeasonStatisticsAggregationUtils'
import { teamForUser } from './TeamMembership'
import { upsertResultIndexForCompletedFixtureSet } from './ResultIndexUtils'

const teamCompetitionTypes = new Set<Competition['_name']>(['league', 'cup', 'subsidiary'])

export async function resultSubmission(result: ResultsSubmitCommand) {
  async function haveResults() {
    let fixturesExist = true
    for (const fixture of result.fixtures) {
      const f = await load<Fixture>(fixture.fixturePath)
      fixturesExist = fixturesExist && f !== null && f !== undefined
    }
    return fixturesExist
  }

  const hasResults = await haveResults()

  const user = await load<User>(entityPath('user', result.userID))
  const fixtureSetPaths = new Set<string>()
  const statsUpdateFixtures: Fixture[] = []
  for (const fixture of result.fixtures) {
    await saveFixture(user, result.reportText, fixture)
    fixtureSetPaths.add(parseParent(fixture.fixturePath))
  }

  for (const f of result.fixtures) {
    const fixture = await load<Fixture>(f.fixturePath)
    if (!hasResults) {
      const isSubsidiary = await subsidiary(fixture)
      const leagueTables = await tables(fixture)
      if (leagueTables.length > 0) {
        await updateTables(leagueTables, fixture)

        if (!isSubsidiary) {
          statsUpdateFixtures.push(fixture)
        }
      }
      if (!isSubsidiary) {
        // await fireNotifications(fixture)
      }
    }
  }

  const completedFixtureSetPaths = await updateCompletedFixtureSetSummaries([...fixtureSetPaths])

  for (const fixture of statsUpdateFixtures) {
    if (!completedFixtureSetPaths.has(parseParent(fixture.path))) {
      await fireStatsUpdate(fixture)
    }
  }

  async function saveFixture(user: User, reportText: string | undefined, result: ResultValues) {
    const fixture = await load<Fixture>(result.fixturePath)
    const isSubsidiary = await subsidiary(fixture)
    const report = isSubsidiary ? undefined : reportText && reportText.trim()

    async function newText(reportText: string) {
      const id = uuid()
      const text: Text = {
        id,
        text: reportText,
        mimeType: 'text/markdown',
        path: entityPath('text', id),
      }
      return save(text)
    }

    function newResult(): Result {
      return { homeScore: result.homeScore, awayScore: result.awayScore, submitter: docRef(user) }
    }

    async function newReport(reportText: string): Promise<Report> {
      const team = await teamForUser(user)
      if (!team) {
        throw new Error(`No team found for user ${user.id}`)
      }
      const id = uuid()
      return {
        id,
        team: docRef(team),
        text: await newText(reportText),
        path: `${fixture.path}/report/${id}`,
      }
    }

    if (!fixture.result) {
      fixture.result = newResult()
    }

    if (report) {
      await save(await newReport(report))
    }

    return await save(fixture)
  }

  async function subsidiary(fixture: Fixture) {
    const path = parseParent(parseParent(fixture.path))
    const competition = await load<Competition>(path)
    return competition._name === 'subsidiary'
  }

  async function tables(fixture: Fixture) {
    return await list<LeagueTable>('leaguetable', parseParent(parseParent(fixture.path)))
  }

  async function updateTables(tables: LeagueTable[], fixture: Fixture) {
    const newTables = recalculateTables(tables, [fixture])

    saveAll(newTables)
  }

  async function fireStatsUpdate(fixture: Fixture) {
    const season = await currentSeason()
    queueMicrotask(() => statsUpdate(season.id, [fixture]))
  }

  async function statsUpdate(seasonId: string, fixtures: Fixture[]) {
    const season = await load<Season>(entityPath('season', seasonId))

    fixtures.forEach((f) => updateForFixture(f, season))
  }
}

async function updateCompletedFixtureSetSummaries(fixtureSetPaths: string[]) {
  const completedFixtureSetPaths = new Set<string>()
  const competitionPaths = new Set<string>()

  for (const fixtureSetPath of fixtureSetPaths) {
    try {
      const competitionPath = await updateCompletedFixtureSetSummary(fixtureSetPath)
      if (competitionPath) {
        completedFixtureSetPaths.add(fixtureSetPath)
        competitionPaths.add(competitionPath)
      }
    } catch (error) {
      console.error(`Failed to update fixture set results summary for ${fixtureSetPath}`, error)
    }
  }

  for (const competitionPath of competitionPaths) {
    try {
      await updateCompletedCompetitionRoundup(competitionPath)
    } catch (error) {
      console.error(`Failed to update competition roundup for ${competitionPath}`, error)
    }
  }

  return completedFixtureSetPaths
}

async function updateCompletedFixtureSetSummary(fixtureSetPath: string) {
  const fixtureSet = await load<Fixtures>(fixtureSetPath)
  if (!fixtureSet) return

  const fixtures = await list<Fixture>('fixture', fixtureSet.path)
  if (!fixtureSetHasCompletedResults(fixtures)) return

  queueFixtureSetStatisticsRecalculation(fixtureSet.path)
  await updateAggregationForCompletedFixtureSet(fixtureSet.path)
  await upsertResultIndexForCompletedFixtureSet(fixtureSet, fixtures)
  await generateAndSaveFixtureSetResultsSummary(fixtureSet, fixtures, false)

  return parseParent(fixtureSet.path)
}

export async function regenerateFixtureSetResultsSummary(fixtureSetPath: string) {
  const fixtureSet = await load<Fixtures>(fixtureSetPath)
  if (!fixtureSet) {
    throw new Error(`Fixture set not found: ${fixtureSetPath}`)
  }

  const fixtures = await list<Fixture>('fixture', fixtureSet.path)
  if (fixtures.length === 0) {
    throw new Error('Cannot generate a results summary for an empty fixture set')
  }

  if (fixtures.some((fixture) => !fixture.result)) {
    throw new Error('Cannot generate a results summary until all fixtures have results')
  }

  const updatedFixtureSet = await generateAndSaveFixtureSetResultsSummary(
    fixtureSet,
    fixtures,
    true,
  )
  if (!updatedFixtureSet) {
    throw new Error('Gemini did not return a fixture set results summary')
  }
  return updatedFixtureSet
}

export async function regenerateCompetitionRoundup(competitionPath: string) {
  const competition = await load<Competition>(competitionPath)
  if (!competition) {
    throw new Error(`Competition not found: ${competitionPath}`)
  }

  if (!teamCompetitionTypes.has(competition._name)) {
    throw new Error('Cannot generate a roundup for a singleton competition')
  }

  const updatedCompetition = await generateAndSaveCompetitionRoundup(competition, true)
  if (!updatedCompetition) {
    throw new Error('Gemini did not return a competition roundup')
  }
  return updatedCompetition
}

async function updateCompletedCompetitionRoundup(competitionPath: string) {
  const competition = await load<Competition>(competitionPath)
  if (!competition || !teamCompetitionTypes.has(competition._name)) return undefined

  return generateAndSaveCompetitionRoundup(competition, false)
}

async function generateAndSaveCompetitionRoundup(
  competition: Competition,
  failOnEmptyRoundup: boolean,
) {
  const fixtureSets = (await list<Fixtures>('fixtures', competition.path)).sort((a, b) =>
    a.date.localeCompare(b.date),
  )
  if (fixtureSets.length === 0) {
    if (failOnEmptyRoundup) {
      throw new Error('Cannot generate a roundup for a competition with no fixture groups')
    }
    return undefined
  }

  const completedFixtureSets: Array<{ fixtureSet: Fixtures; fixtures: Fixture[] }> = []
  for (const fixtureSet of fixtureSets) {
    const fixtures = await list<Fixture>('fixture', fixtureSet.path)
    if (!fixtureSetHasCompletedResults(fixtures)) {
      if (failOnEmptyRoundup) {
        throw new Error('Cannot generate a roundup until all fixture groups have results')
      }
      return undefined
    }
    completedFixtureSets.push({ fixtureSet, fixtures })
  }

  const roundup = await generateCompetitionRoundup({
    competitionName: competition.name ?? competition.id,
    fixtureSets: await Promise.all(completedFixtureSets.map(competitionRoundupFixtureSetInput)),
    statistics: await competitionStatisticsAggregationInput(competition),
  })
  if (!roundup) {
    if (failOnEmptyRoundup) {
      throw new Error('Gemini did not return a competition roundup')
    }
    return undefined
  }

  const roundupText = await competitionRoundupText(competition)
  roundupText.text = roundup.text
  roundupText.mimeType = 'text/markdown'
  await save(roundupText)

  competition.roundup = { id: roundupText.id, path: roundupText.path }
  competition.roundupGeneratedAt = new Date().toISOString()
  competition.roundupModel = roundup.model

  await save(competition)

  return competition
}

function fixtureSetHasCompletedResults(fixtures: Fixture[]) {
  return fixtures.length > 0 && fixtures.every((fixture) => fixture.result)
}

async function generateAndSaveFixtureSetResultsSummary(
  fixtureSet: Fixtures,
  fixtures: Fixture[],
  failOnEmptySummary: boolean,
) {
  const competition = await load<Competition>(parseParent(fixtureSet.path))
  const summary = await generateFixtureSetResultsSummary({
    competitionName: competition?.name ?? competition?.id ?? 'Competition',
    fixtureSetDescription: fixtureSet.description,
    fixtureSetDate: fixtureSet.date,
    fixtures: await Promise.all(fixtures.map(fixtureSummaryInput)),
  })

  if (!summary && failOnEmptySummary) {
    throw new Error('Gemini did not return a fixture set results summary')
  }
  if (!summary) return undefined

  const summaryText = await fixtureSetResultsSummaryText(fixtureSet)
  summaryText.text = summary.text
  summaryText.mimeType = 'text/markdown'
  await save(summaryText)

  fixtureSet.resultsSummary = { id: summaryText.id, path: summaryText.path }
  fixtureSet.resultsSummaryGeneratedAt = new Date().toISOString()
  fixtureSet.resultsSummaryModel = summary.model

  await save(fixtureSet)

  return fixtureSet
}

async function fixtureSetResultsSummaryText(fixtureSet: Fixtures): Promise<Text> {
  const existingPath = textReferencePath(fixtureSet.resultsSummary)
  if (existingPath) {
    const existingText = await load<Text>(existingPath)
    if (existingText) return existingText
  }

  const id = uuid()
  return {
    id,
    path: entityPath('text', id),
    text: '',
    mimeType: 'text/markdown',
  }
}

async function competitionRoundupText(competition: Competition): Promise<Text> {
  const existingPath = textReferencePath(competition.roundup)
  if (existingPath) {
    const existingText = await load<Text>(existingPath)
    if (existingText) return existingText
  }

  const id = uuid()
  return {
    id,
    path: entityPath('text', id),
    text: '',
    mimeType: 'text/markdown',
  }
}

function textReferencePath(value: unknown) {
  if (!value) return undefined

  const path =
    typeof value === 'string'
      ? value
      : typeof value === 'object' && typeof (value as { path?: unknown }).path === 'string'
        ? (value as { path: string }).path
        : undefined

  if (!path) return undefined

  const normalized = path.replace(/^\/+|\/+$/g, '')
  const segments = normalized.split('/').filter(Boolean)
  return normalized.startsWith('text/') && segments.length % 2 === 0 ? normalized : undefined
}

async function competitionRoundupFixtureSetInput({
  fixtureSet,
  fixtures,
}: {
  fixtureSet: Fixtures
  fixtures: Fixture[]
}) {
  const summaryText = await textReferenceText(fixtureSet.resultsSummary)

  return {
    fixtureSetDescription: fixtureSet.description,
    fixtureSetDate: fixtureSet.date,
    summary: summaryText ? compactReportText(summaryText, 700) : undefined,
    fixtures: await Promise.all(fixtures.map(fixtureScoreInput)),
  }
}

async function textReferenceText(textReference: unknown) {
  const path = textReferencePath(textReference)
  if (!path) return undefined

  const text = await load<Text>(path)
  return text?.text?.trim()
}

async function fixtureScoreInput(fixture: Fixture): Promise<CompetitionRoundupFixtureResult> {
  const home = await load<Team>(fixture.home)
  const away = await load<Team>(fixture.away)
  const result = fixture.result!

  return {
    homeTeam: teamName(home, fixture.home.id),
    awayTeam: teamName(away, fixture.away.id),
    homeScore: result.homeScore,
    awayScore: result.awayScore,
  }
}

async function fixtureSummaryInput(fixture: Fixture): Promise<FixtureSetSummaryFixture> {
  const home = await load<Team>(fixture.home)
  const away = await load<Team>(fixture.away)
  const result = fixture.result!

  return {
    homeTeam: teamName(home, fixture.home.id),
    awayTeam: teamName(away, fixture.away.id),
    homeScore: result.homeScore,
    awayScore: result.awayScore,
    reports: await reportSummaries(fixture),
  }
}

async function reportSummaries(fixture: Fixture) {
  const reports = await list<Report>('report', fixture.path)
  const summaries: string[] = []

  for (const report of reports) {
    const text = await load<Text>(report.text)
    if (!text?.text?.trim()) continue

    const team = await load<Team>(report.team)
    summaries.push(`${teamName(team, report.team.id)}: ${compactReportText(text.text)}`)
  }

  return summaries
}

async function competitionStatisticsAggregationInput(competition: Competition) {
  if (competition._name !== 'league') return undefined

  const seasonPath = parseParent(competition.path)
  const seasonId = seasonPath.split('/').pop()
  if (!seasonId) return undefined

  const aggregation = await load<SeasonStatisticsAggregation>(
    entityPath('seasonstatisticsaggregation', seasonId),
  )
  if (!aggregation) return undefined

  const competitionAggregation = aggregation.competitions.find(
    (c) => toPath(c.competition) === competition.path,
  )
  if (!competitionAggregation) return undefined

  return {
    averageScore: competitionAggregation.averageScore,
    averageWinningScore: competitionAggregation.averageWinningScore,
    averageLosingScore: competitionAggregation.averageLosingScore,
    tableSnapshots: await Promise.all(
      competitionAggregation.tableSnapshots.map(competitionRoundupTableSnapshotInput),
    ),
  }
}

async function competitionRoundupTableSnapshotInput(snapshot: LeagueTableSnapshot) {
  return {
    fixtureSetDescription: snapshot.fixtureSetDescription,
    fixtureSetDate: snapshot.fixtureSetDate,
    tables: await Promise.all(snapshot.tables.map(competitionRoundupTableSnapshotTableInput)),
  }
}

async function competitionRoundupTableSnapshotTableInput(table: LeagueTableSnapshotTable) {
  return {
    description: table.description,
    rows: await Promise.all(table.rows.map(competitionRoundupTableSnapshotRowInput)),
  }
}

async function competitionRoundupTableSnapshotRowInput(row: LeagueTableRow) {
  const team = await load<Team>(row.team)
  return {
    played: row.played,
    won: row.won,
    drawn: row.drawn,
    lost: row.lost,
    matchPointsFor: row.matchPointsFor,
    matchPointsAgainst: row.matchPointsAgainst,
    leaguePoints: row.leaguePoints,
    position: row.position,
    team: teamName(team, toPath(row.team).split('/').pop()!),
  }
}

function teamName(team: Team | undefined, fallback: string) {
  return team?.name ?? team?.shortName ?? fallback
}

function compactReportText(text: string, maxLength = 1200) {
  const compacted = text.replace(/\s+/g, ' ').trim()
  return compacted.length > maxLength ? `${compacted.slice(0, maxLength - 3)}...` : compacted
}

function queueFixtureSetStatisticsRecalculation(fixtureSetPath: string) {
  queueSeasonStatisticsRecalculation(parseParent(parseParent(fixtureSetPath)))
}

function queueSeasonStatisticsRecalculation(seasonPath: string) {
  if (!seasonPath) return

  queueMicrotask(() => {
    void recalculateSeasonStatistics(seasonPath)
  })
}

async function recalculateSeasonStatistics(seasonPath: string) {
  try {
    const season = await load<Season>(seasonPath)
    if (!season) return

    await calculateStats(season)
  } catch (error) {
    console.error(`Failed to recalculate team statistics for ${seasonPath}`, error)
  }
}

export function statsRegenerate(seasonId: string) {
  queueSeasonStatisticsRecalculation(entityPath('season', seasonId))
}
