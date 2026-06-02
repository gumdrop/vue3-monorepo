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
  Team,
  Text,
  User,
} from '@quizleague/shared'
import { v4 as uuid } from 'uuid'
import { docRef, entityPath, list, load, save, saveAll } from '../storage/Storage'
import { currentSeason } from './util'
import { calculateStats, updateForFixture } from './StatisticsUtils'
import {
  generateFixtureSetResultsSummary,
  type FixtureSetSummaryFixture,
} from './GeminiResultsSummary'
import { teamForUser } from './TeamMembership'

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
          await fireStatsUpdate(fixture)
        }
      }
      if (!isSubsidiary) {
        // await fireNotifications(fixture)
      }
    }
  }

  await updateCompletedFixtureSetSummaries([...fixtureSetPaths])

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
  for (const fixtureSetPath of fixtureSetPaths) {
    try {
      await updateCompletedFixtureSetSummary(fixtureSetPath)
    } catch (error) {
      console.error(`Failed to update fixture set results summary for ${fixtureSetPath}`, error)
    }
  }
}

async function updateCompletedFixtureSetSummary(fixtureSetPath: string) {
  const fixtureSet = await load<Fixtures>(fixtureSetPath)
  if (!fixtureSet) return

  const fixtures = await list<Fixture>('fixture', fixtureSet.path)
  if (fixtures.length === 0 || fixtures.some((fixture) => !fixture.result)) return

  await generateAndSaveFixtureSetResultsSummary(fixtureSet, fixtures, false)
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

function teamName(team: Team | undefined, fallback: string) {
  return team?.name ?? team?.shortName ?? fallback
}

function compactReportText(text: string) {
  const compacted = text.replace(/\s+/g, ' ').trim()
  return compacted.length > 1200 ? `${compacted.slice(0, 1197)}...` : compacted
}

export async function statsRegenerate(seasonId: string) {
  const season = await load<Season>(entityPath('season', seasonId))

  queueMicrotask(() => calculateStats(season))
}
