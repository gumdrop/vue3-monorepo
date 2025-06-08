import {
  Competition,
  Fixture,
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
import { calculateStats, uppdateForFixture } from './StatisticsUtils'

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
  for (const fixture of result.fixtures) {
    await saveFixture(user, result.reportText, fixture)
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
      const team = await teamFromUser(user)
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

    async function teamFromUser(user: User) {
      const teams = await list<Team>('team')

      const team = teams.filter((t) => t.users.some((u) => u.id == user.id))[0]

      return team
    }
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

    fixtures.forEach((f) => uppdateForFixture(f, season))
  }
}

export async function statsRegenerate(seasonId: string) {
  const season = await load<Season>(entityPath('season', seasonId))

  queueMicrotask(() => calculateStats(season))
}
