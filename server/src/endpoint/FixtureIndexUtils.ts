import {
  Competition,
  Fixture,
  Fixtures,
  parseParent,
  FixtureIndex,
  FixtureIndexFixture,
  FixtureIndexStatus,
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

export async function upsertFixtureIndexForFixtureSet(
  fixtureSet: Fixtures,
  fixtures: Fixture[],
) {
  const fixtureIndex = await fixtureIndexForFixtureSet(fixtureSet, fixtures)
  if (!fixtureIndex) return undefined

  await save(fixtureIndex)
  return fixtureIndex
}

export async function rebuildSeasonFixtureIndex(season: Season) {
  const existing = await runQuery<FixtureIndex>(
    collection<FixtureIndex>('fixtureindex').where('seasonId', '==', season.id),
  )
  await deleteAll(existing)

  const fixtureIndexes: FixtureIndex[] = []
  const competitions = await list<Competition>('competition', season.path)

  for (const competition of competitions) {
    const fixtureSets = await list<Fixtures>('fixtures', competition.path)
    for (const fixtureSet of fixtureSets) {
      const fixtures = await list<Fixture>('fixture', fixtureSet.path)
      const fixtureIndex = await fixtureIndexForFixtureSet(
        fixtureSet,
        fixtures,
        competition,
        season,
      )
      if (fixtureIndex) {
        fixtureIndexes.push(fixtureIndex)
      }
    }
  }

  await saveAll(fixtureIndexes)

  const status: FixtureIndexStatus = {
    id: season.id,
    path: entityPath('fixtureindexstatus', season.id),
    seasonId: season.id,
    rebuiltAt: new Date().toISOString(),
    fixtureSetCount: fixtureIndexes.length,
  }
  await save(status)

  return status
}

async function fixtureIndexForFixtureSet(
  fixtureSet: Fixtures,
  fixtures: Fixture[],
  providedCompetition?: Competition,
  providedSeason?: Season,
) {
  const competitionPath = parseParent(fixtureSet.path)
  const seasonPath = parseParent(competitionPath)
  const competition = providedCompetition ?? (await load<Competition>(competitionPath))
  const season = providedSeason ?? (await load<Season>(seasonPath))
  if (!competition || !season) return undefined

  const indexedFixtures = fixtures.map(fixtureIndexFixture)
  const id = fixtureIndexId(fixtureSet.path)

  return {
    id,
    path: entityPath('fixtureindex', id),
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
    teamIds: teamIds(indexedFixtures),
    fixtures: indexedFixtures,
  } satisfies FixtureIndex
}

function fixtureIndexFixture(fixture: Fixture): FixtureIndexFixture {
  const result = fixture.result
  const indexedFixture: FixtureIndexFixture = {
    fixturePath: fixture.path,
    homeTeamId: fixture.home.id,
    homeTeamPath: fixture.home.path,
    awayTeamId: fixture.away.id,
    awayTeamPath: fixture.away.path,
  }

  if (result) {
    indexedFixture.result = { homeScore: result.homeScore, awayScore: result.awayScore }
  }

  return indexedFixture
}

function fixtureIndexId(fixtureSetPath: string) {
  return encodeURIComponent(fixtureSetPath)
}

function teamIds(fixtures: FixtureIndexFixture[]) {
  return Array.from(
    new Set(fixtures.flatMap((fixture) => [fixture.homeTeamId, fixture.awayTeamId])),
  ).sort((left, right) => left.localeCompare(right))
}
