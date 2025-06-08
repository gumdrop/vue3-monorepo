import type Entity from './Entity'

export interface User extends Entity {
  name: string
  email: string
  retired: boolean
}
