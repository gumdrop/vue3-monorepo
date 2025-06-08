import type { PathAndId } from './PathAndId'
import type Entity from './Entity'
import type { CalendarEvent } from './Event'
import type { Text } from './Text'

export interface Season extends Entity {
  startYear: number
  endYear: number
  text: PathAndId<Text> | undefined
  calendar: CalendarEvent[]
}
