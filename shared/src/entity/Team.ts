import type { PathAndId } from './PathAndId'
import type Entity from './Entity'
import type { Venue } from './Venue'
import type { Text } from './Text'
import type { User } from './User'

export interface Team extends Entity {
  name: string
  shortName: string
  venue: PathAndId<Venue>
  text: PathAndId<Text>
  users: PathAndId<User>[]
  handle?: string
  retired: boolean
}
