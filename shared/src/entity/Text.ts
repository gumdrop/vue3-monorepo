import type Entity from './Entity'

export interface Text extends Entity {
  text: string
  mimeType: string
}
