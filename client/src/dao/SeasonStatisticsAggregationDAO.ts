import type { SeasonStatisticsAggregation } from '@quizleague/shared'
import DAO from './DAO'
import { GenericConverter } from './GenericConverter'

class SeasonStatisticsAggregationDAO extends DAO<SeasonStatisticsAggregation> {
  constructor() {
    super('seasonstatisticsaggregation')
  }

  override converter = new GenericConverter<SeasonStatisticsAggregation>()
}

export default new SeasonStatisticsAggregationDAO()
