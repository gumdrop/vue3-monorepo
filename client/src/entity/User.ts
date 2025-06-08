import type Entity from './Entity'

export default class User implements Entity {
  constructor(
    public readonly id: string,
    public name: string,
    public email: string,
    public readonly key: string,
    public retired: boolean = false,
  ) {
    this.path = key
  }
  path: string = ''
}
