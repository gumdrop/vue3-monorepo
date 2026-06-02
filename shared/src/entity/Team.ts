import type { PathAndId } from './PathAndId'
import type Entity from './Entity'
import type { Venue } from './Venue'
import type { Text } from './Text'

export interface Team extends Entity {
  name: string
  shortName: string
  venue: PathAndId<Venue>
  text: PathAndId<Text>
  handle?: string
  retired: boolean
}
