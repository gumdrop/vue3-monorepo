import type { ZonedDateTime } from '@js-joda/core'
import type { User } from './User'
import type Entity from './Entity'
import type { PathAndId } from './PathAndId'

export interface SiteUser extends Entity {
  handle: string
  avatar: string
  user?: PathAndId<User>
  uid?: string
  hearbeat?: ZonedDateTime
}
