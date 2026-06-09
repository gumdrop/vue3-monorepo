import type Entity from './Entity'

export interface ResultIndexFixture {
  fixturePath: string
  homeTeamId: string
  homeTeamPath: string
  awayTeamId: string
  awayTeamPath: string
  homeScore: number
  awayScore: number
}

export interface ResultIndex extends Entity {
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
  fixtures: ResultIndexFixture[]
}

export interface ResultIndexStatus extends Entity {
  seasonId: string
  rebuiltAt: string
  fixtureSetCount: number
}
