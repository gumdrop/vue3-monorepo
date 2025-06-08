import type { PathAndId } from './PathAndId'
import type { Venue } from './Venue'
import type { Competition } from './Competition'

export interface Event {
  date: string
  time: string
  duration: number
  venue?: PathAndId<Venue>
}

export interface CalendarEvent extends Event {
  description: string
}

export interface EventWrapper {
  date: string
  time: string
  duration: number
  description: string
  venue?: Venue
  type: 'calendar' | 'competition'
  competition?: Competition
}
