import type Text from '@/entity/Text'
import DAO from './DAO'

class TextDAO extends DAO<Text> {
  constructor() {
    super('text')
  }
}

export default new TextDAO()
