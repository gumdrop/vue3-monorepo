import type Season from '@/entity/Season'
import DAO from './DAO'

class SeasonDAO extends DAO<Season> {
  constructor() {
    super('season')
  }
}

export default new SeasonDAO()
