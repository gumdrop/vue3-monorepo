import type Team from '@/entity/Team'
import type { Fixture } from '@/entity/Fixtures'

export type FixtureEdit = Partial<Fixture> & {
  homePath?: string
  awayPath?: string
  venuePath?: string
}

export const toFixtureEntity = (fixture: FixtureEdit): Fixture => {
  const fixtureEntity = { ...fixture }
  delete fixtureEntity.homePath
  delete fixtureEntity.awayPath
  delete fixtureEntity.venuePath
  return fixtureEntity as Fixture
}

export const fixtureTeamPaths = (fixture: Partial<Fixture>) => [fixture.home?.path, fixture.away?.path].filter(Boolean)

export const allocatedFixtureTeamPaths = (fixtures: Partial<Fixture>[]) => {
  return new Set(fixtures.flatMap(fixtureTeamPaths))
}

export const unallocatedFixtureTeams = (teams: Team[], fixtures: Partial<Fixture>[]) => {
  const allocatedPaths = allocatedFixtureTeamPaths(fixtures)
  return teams.filter((team) => !allocatedPaths.has(team.path))
}

export const canSaveFixtureEdit = (fixture: FixtureEdit) => {
  return Boolean(fixture.homePath && fixture.awayPath && fixture.homePath !== fixture.awayPath)
}

export const fixtureVenueDiffersFromHomeVenue = (fixture: Partial<Fixture>, teams: Team[]) => {
  const fixtureVenuePath = fixture.venue?.path
  if (!fixture.home?.path || !fixtureVenuePath) return false

  const homeTeam = teams.find(
    (team) => team.path === fixture.home?.path || team.id === fixture.home?.id,
  )
  const homeVenuePath = homeTeam?.venue?.path

  return Boolean(homeVenuePath && fixtureVenuePath !== homeVenuePath)
}

export const allocatedTeamPathsForOtherFixtures = (fixtures: Partial<Fixture>[], fixtureId?: string) => {
  return new Set(
    fixtures
      .filter((fixture) => fixture.id !== fixtureId)
      .flatMap(fixtureTeamPaths),
  )
}

export const availableTeamsForFixtureSlot = (
  teams: Team[],
  fixtures: Partial<Fixture>[],
  fixtureToEdit: FixtureEdit,
  slot: 'home' | 'away',
) => {
  const selectedPath = slot === 'home' ? fixtureToEdit.homePath : fixtureToEdit.awayPath
  const otherSelectedPath = slot === 'home' ? fixtureToEdit.awayPath : fixtureToEdit.homePath
  const allocatedToOtherFixtures = allocatedTeamPathsForOtherFixtures(fixtures, fixtureToEdit.id)

  return teams.filter((team) => {
    if (team.path === selectedPath) return true
    if (team.path === otherSelectedPath) return false
    return !allocatedToOtherFixtures.has(team.path)
  })
}

export const applyHomeTeamSelection = (fixture: FixtureEdit, teams: Team[], homePath: string | null): FixtureEdit => {
  const selectedHomePath = homePath || ''
  const team = teams.find((t) => t.path === selectedHomePath)
  return {
    ...fixture,
    homePath: selectedHomePath,
    venuePath: team?.venue?.path || '',
  }
}
