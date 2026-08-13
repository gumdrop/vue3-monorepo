import type ResultIndex from '@/entity/ResultIndex'
import type { ResultIndexStatus } from '@/entity/ResultIndex'
import { currentLocalDate } from '@/services/DateService'
import { limit as firestoreLimit, orderBy, query, where, type Query } from 'firebase/firestore'
import DAO from './DAO'
import FixturesDAO, { fixtureDAO } from './FixturesDAO'

class ResultIndexStatusDAO extends DAO<ResultIndexStatus> {
  constructor() {
    super('resultindexstatus')
  }
}

class ResultIndexDAO extends DAO<ResultIndex> {
  constructor() {
    super('resultindex')
  }

  async seasonFixtureSetDocuments(seasonId: string, take?: number) {
    if (!(await resultIndexStatusDAO.isComplete(seasonId))) return undefined

    return (
      await this.entities(this.seasonResultsQuery(seasonId, currentLocalDate().toString(), take))
    ).map((result) => FixturesDAO.getByPath(result.fixtureSetPath))
  }

  async seasonFixtureSetDocumentsForDay(seasonId: string) {
    if (!(await resultIndexStatusDAO.isComplete(seasonId))) return undefined

    const results = await this.entities(
      this.seasonResultsQuery(seasonId, currentLocalDate().toString()),
    )
    if (!results.length) return []
    const latestDate = results[0].fixtureSetDate
    return results
      .filter((result) => result.fixtureSetDate === latestDate)
      .map((result) => FixturesDAO.getByPath(result.fixtureSetPath))
  }

  async competitionFixtureSetDocuments(competitionPath: string, take?: number) {
    const seasonId = seasonIdFromCompetitionPath(competitionPath)
    if (!seasonId || !(await resultIndexStatusDAO.isComplete(seasonId))) return undefined

    return (
      await this.entities(
        withOptionalLimit(
          query(
            this.collection(),
            where('competitionPath', '==', competitionPath),
            where('fixtureSetDate', '<=', currentLocalDate().toString()),
            orderBy('fixtureSetDate', 'desc'),
          ),
          take,
        ),
      )
    ).map((result) => FixturesDAO.getByPath(result.fixtureSetPath))
  }

  async teamFixtureDocuments(teamId: string, seasonId: string, take?: number) {
    if (!(await resultIndexStatusDAO.isComplete(seasonId))) return undefined

    return (
      await this.entities(
        withOptionalLimit(
          query(
            this.collection(),
            where('seasonId', '==', seasonId),
            where('firstClass', '==', true),
            where('teamIds', 'array-contains', teamId),
            where('fixtureSetDate', '<=', currentLocalDate().toString()),
            orderBy('fixtureSetDate', 'desc'),
          ),
          take,
        ),
      )
    )
      .flatMap((result) => result.fixtures)
      .filter((fixture) => fixture.homeTeamId === teamId || fixture.awayTeamId === teamId)
      .slice(0, take)
      .map((fixture) => fixtureDAO.getByPath(fixture.fixturePath))
  }

  private seasonResultsQuery(seasonId: string, today: string, take?: number) {
    return withOptionalLimit(
      query(
        this.collection(),
        where('seasonId', '==', seasonId),
        where('firstClass', '==', true),
        where('fixtureSetDate', '<=', today),
        orderBy('fixtureSetDate', 'desc'),
      ),
      take,
    )
  }
}

class CompleteResultIndexStatusDAO extends ResultIndexStatusDAO {
  async isComplete(seasonId: string) {
    const status = await this.getDataById(seasonId)
    return Boolean(status?.rebuiltAt)
  }
}

function withOptionalLimit<T>(baseQuery: Query<T>, take?: number) {
  return take === undefined || take >= Number.MAX_SAFE_INTEGER
    ? baseQuery
    : query(baseQuery, firestoreLimit(take))
}

function seasonIdFromCompetitionPath(competitionPath: string) {
  const parts = competitionPath.split('/').filter(Boolean)
  const seasonSegment = parts.indexOf('season')
  return seasonSegment >= 0 ? parts[seasonSegment + 1] : undefined
}

export const resultIndexStatusDAO = new CompleteResultIndexStatusDAO()

export default new ResultIndexDAO()
