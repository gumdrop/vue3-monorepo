import type Statistics from '@/entity/Statisitics'
import { query, where } from 'firebase/firestore'
import DAO from './DAO'

class StatisticsDAO extends DAO<Statistics> {
  constructor() {
    super('statistics')
  }

  teamStats = (teamId: string, seasonId: string) => {
    return query(
      this.collection(),
      where('team.id', '==', teamId),
      where('season.id', '==', seasonId),
    )
  }

  allTeamStats = (teamId: string) => {
    return query(this.collection(), where('team.id', '==', teamId))
  }
}

export default new StatisticsDAO()
