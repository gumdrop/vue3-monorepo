import type Entity from './Entity'

export interface Venue extends Entity {
  name: string
  address: string
  phone?: string
  email?: string
  website?: string
  imageURL?: string
  retired: boolean
}
