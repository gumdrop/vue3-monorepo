import type { PathAndId } from './PathAndId'
import type Entity from './Entity'
import type { Team } from './Team'
import type { Text } from './Text'
import type { User } from './User'
import type { Venue } from './Venue'

export interface Fixtures extends Entity {
  description: string
  date: string
  start: string
  questionsUrl?: string
}

export interface Fixture extends Entity {
  home: PathAndId<Team>
  away: PathAndId<Team>
  venue?: PathAndId<Venue>
  result?: Result
}

export interface Result {
  homeScore: number
  awayScore: number
  submitter?: PathAndId<User>
  note?: string
}

export interface Report extends Entity {
  team: PathAndId<Team>
  text: PathAndId<Text>
}
