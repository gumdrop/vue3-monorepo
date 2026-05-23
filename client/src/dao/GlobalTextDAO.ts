import type GlobalText from '@/entity/GlobalText'
import DAO from './DAO'

class GlobalTextDAO extends DAO<GlobalText> {
  constructor() {
    super('globaltext')
  }
}

export default new GlobalTextDAO()
