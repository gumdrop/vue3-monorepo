import type CompetitionStatistics from '@/entity/CompetitionStatistics'
import DAO from './DAO'

class CompetitionStatisticsDAO extends DAO<CompetitionStatistics> {
  constructor() {
    super('competitionstatistics')
  }
}

export default new CompetitionStatisticsDAO()
