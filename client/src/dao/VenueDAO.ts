import type Venue from '@/entity/Venue'
import DAO from './DAO'

class VenueDAO extends DAO<Venue> {
  constructor() {
    super('venue')
  }
}

export default new VenueDAO()
