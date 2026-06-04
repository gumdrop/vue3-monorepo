import { fixtureDAO } from '@/dao/FixturesDAO'
import type Fixtures from '@/entity/Fixtures'
import type { Fixture } from '@/entity/Fixtures'

export const hasCompletedResult = (fixture: Fixture) => {
  const result = fixture.result
  return Boolean(result && Number.isFinite(result.homeScore) && Number.isFinite(result.awayScore))
}

export const isCompletedFixtureSet = async (fixtureSet: Fixtures) => {
  const fixtures = await fixtureDAO.entities(fixtureDAO.subCollection(fixtureSet.path))
  return fixtures.length > 0 && fixtures.every(hasCompletedResult)
}

export const completedFixtureSets = async (fixtureSets: Fixtures[]) => {
  const completed: Fixtures[] = []

  for (const fixtureSet of fixtureSets) {
    if (await isCompletedFixtureSet(fixtureSet)) {
      completed.push(fixtureSet)
    }
  }

  return completed
}
