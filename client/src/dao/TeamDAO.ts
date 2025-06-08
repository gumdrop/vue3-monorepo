import type Team from '@/entity/Team'
import DAO from './DAO'

class TeamDAO extends DAO<Team> {
  constructor() {
    super('team')
  }
}

export default new TeamDAO()
