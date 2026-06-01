import type Statistics from '@/entity/Statisitics'
import { query, where } from 'firebase/firestore'
import DAO from './DAO'
import SeasonDAO from './SeasonDAO'
import TeamDAO from './TeamDAO'

class StatisticsDAO extends DAO<Statistics> {
  constructor() {
    super('statistics')
  }

  teamStats = (teamId: string, seasonId: string) => {
    return query(
      this.collection(),
      where('team', '==', TeamDAO.getById(teamId)),
      where('season', '==', SeasonDAO.getById(seasonId)),
    )
  }

  seasonStats = (seasonId: string) => {
    return query(this.collection(), where('season', '==', SeasonDAO.getById(seasonId)))
  }

  allTeamStats = (teamId: string) => {
    return query(this.collection(), where('team', '==', TeamDAO.getById(teamId)))
  }
}

export default new StatisticsDAO()
