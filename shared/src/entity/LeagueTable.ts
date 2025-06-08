import type { PathAndId } from './PathAndId'
import type { Team } from './Team'
import type Entity from './Entity'

export interface LeagueTable extends Entity {
  description?: string
  rows: LeagueTableRow[]
}

export interface LeagueTableRow {
  team: PathAndId<Team>
  position: string
  played: number
  won: number
  lost: number
  drawn: number
  leaguePoints: number
  matchPointsFor: number
  matchPointsAgainst: number
}
