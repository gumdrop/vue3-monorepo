import {
  Competition,
  Fixture,
  Fixtures,
  parseParent,
  ResultIndex,
  ResultIndexFixture,
  ResultIndexStatus,
  Season,
} from '@quizleague/shared'
import {
  collection,
  deleteAll,
  entityPath,
  list,
  load,
  runQuery,
  save,
  saveAll,
} from '../storage/Storage'

export async function upsertResultIndexForCompletedFixtureSet(
  fixtureSet: Fixtures,
  fixtures: Fixture[],
) {
  const resultIndex = await resultIndexForCompletedFixtureSet(fixtureSet, fixtures)
  if (!resultIndex) return undefined

  await save(resultIndex)
  return resultIndex
}

export async function rebuildSeasonResultIndex(season: Season) {
  const existing = await runQuery<ResultIndex>(
    collection<ResultIndex>('resultindex').where('seasonId', '==', season.id),
  )
  await deleteAll(existing)

  const resultIndexes: ResultIndex[] = []
  const competitions = await list<Competition>('competition', season.path)

  for (const competition of competitions) {
    const fixtureSets = await list<Fixtures>('fixtures', competition.path)
    for (const fixtureSet of fixtureSets) {
      const fixtures = await list<Fixture>('fixture', fixtureSet.path)
      const resultIndex = await resultIndexForCompletedFixtureSet(
        fixtureSet,
        fixtures,
        competition,
        season,
      )
      if (resultIndex) {
        resultIndexes.push(resultIndex)
      }
    }
  }

  await saveAll(resultIndexes)

  const status: ResultIndexStatus = {
    id: season.id,
    path: entityPath('resultindexstatus', season.id),
    seasonId: season.id,
    rebuiltAt: new Date().toISOString(),
    fixtureSetCount: resultIndexes.length,
  }
  await save(status)

  return status
}

async function resultIndexForCompletedFixtureSet(
  fixtureSet: Fixtures,
  fixtures: Fixture[],
  providedCompetition?: Competition,
  providedSeason?: Season,
) {
  if (fixtures.length === 0 || fixtures.some((fixture) => !fixture.result)) return undefined

  const competitionPath = parseParent(fixtureSet.path)
  const seasonPath = parseParent(competitionPath)
  const competition = providedCompetition ?? (await load<Competition>(competitionPath))
  const season = providedSeason ?? (await load<Season>(seasonPath))
  if (!competition || !season) return undefined

  const resultFixtures = fixtures.map(resultIndexFixture)
  const id = resultIndexId(fixtureSet.path)

  return {
    id,
    path: entityPath('resultindex', id),
    seasonId: season.id,
    seasonPath: season.path,
    competitionId: competition.id,
    competitionPath: competition.path,
    competitionName: competition.name ?? competition.id,
    firstClass: competition._name !== 'subsidiary',
    fixtureSetPath: fixtureSet.path,
    fixtureSetDate: fixtureSet.date,
    fixtureSetStart: fixtureSet.start,
    fixtureSetDescription: fixtureSet.description,
    teamIds: teamIds(resultFixtures),
    fixtures: resultFixtures,
  } satisfies ResultIndex
}

function resultIndexFixture(fixture: Fixture): ResultIndexFixture {
  const result = fixture.result
  if (!result) {
    throw new Error(`Cannot index fixture without a result: ${fixture.path}`)
  }

  return {
    fixturePath: fixture.path,
    homeTeamId: fixture.home.id,
    homeTeamPath: fixture.home.path,
    awayTeamId: fixture.away.id,
    awayTeamPath: fixture.away.path,
    homeScore: result.homeScore,
    awayScore: result.awayScore,
  }
}

function resultIndexId(fixtureSetPath: string) {
  return encodeURIComponent(fixtureSetPath)
}

function teamIds(fixtures: ResultIndexFixture[]) {
  return Array.from(
    new Set(fixtures.flatMap((fixture) => [fixture.homeTeamId, fixture.awayTeamId])),
  ).sort((left, right) => left.localeCompare(right))
}
