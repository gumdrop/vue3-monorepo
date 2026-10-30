import type Entity from './Entity'

export interface FixtureIndexFixture {
  fixturePath: string
  homeTeamId: string
  homeTeamPath: string
  awayTeamId: string
  awayTeamPath: string
  result?: { homeScore: number; awayScore: number }
}

export interface FixtureIndex extends Entity {
  seasonId: string
  seasonPath: string
  competitionId: string
  competitionPath: string
  competitionName: string
  firstClass: boolean
  fixtureSetPath: string
  fixtureSetDate: string
  fixtureSetStart: string
  fixtureSetDescription: string
  teamIds: string[]
  fixtures: FixtureIndexFixture[]
}

export interface FixtureIndexStatus extends Entity {
  seasonId: string
  rebuiltAt: string
  fixtureSetCount: number
}
