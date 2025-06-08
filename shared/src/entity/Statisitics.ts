import type { LocalDate } from '@js-joda/core'
import type Entity from './Entity'
import type { Team } from './Team'
import type { Season } from './Season'
import type { LeagueTable } from './LeagueTable'
import type { PathAndId } from './PathAndId'

export interface Statistics extends Entity {
  team: PathAndId<Team>
  season: PathAndId<Season>
  table: PathAndId<LeagueTable>
  seasonStats: SeasonStats
  weekStats: { [keyof: string]: WeekStats }
}

export interface SeasonStats {
  currentLeaguePosition: number
  runningPointsFor: number
  runningPointsAgainst: number
  runningPointsDifference: number
  headToHead: HeadToHead[]
}

export interface HeadToHead {
  win: number
  lose: number
  draw: number
  team: PathAndId<Team>
}

export interface WeekStats {
  date: LocalDate
  leaguePosition: number
  pointsFor: number
  pointsAgainst: number
  pointsDifference: number
  cumuPointsFor: number
  cumuPointsAgainst: number
  cumuPointsDifference: number
  ignorable: boolean
}
