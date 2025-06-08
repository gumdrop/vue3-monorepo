import type { PathAndId } from './PathAndId'
import type Entity from './Entity'
import type { Text } from './Text'

export interface GlobalText extends Entity {
  name: string
  text: { [key: string]: PathAndId<Text> }
}
