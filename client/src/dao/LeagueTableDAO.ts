import type LeagueTable from '@/entity/LeagueTable'
import DAO from './DAO'

class LeagueTableDAO extends DAO<LeagueTable> {
  constructor() {
    super('leaguetable')
  }
}

export default new LeagueTableDAO()
