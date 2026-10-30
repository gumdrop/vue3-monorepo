import type FixtureIndex from '@/entity/FixtureIndex'
import type { FixtureIndexStatus } from '@/entity/FixtureIndex'
import { currentLocalDate } from '@/services/DateService'
import { limit as firestoreLimit, orderBy, query, where, type Query } from 'firebase/firestore'
import DAO from './DAO'
import FixturesDAO, { fixtureDAO } from './FixturesDAO'

class FixtureIndexStatusDAO extends DAO<FixtureIndexStatus> {
  constructor() {
    super('fixtureindexstatus')
  }
}

class FixtureIndexDAO extends DAO<FixtureIndex> {
  constructor() {
    super('fixtureindex')
  }

  async seasonFixtureSetDocuments(seasonId: string, take?: number) {
    if (!(await fixtureIndexStatusDAO.isComplete(seasonId))) return undefined

    return (
      await this.entities(this.seasonQuery(seasonId, currentLocalDate().toString(), take))
    ).map((entry) => FixturesDAO.getByPath(entry.fixtureSetPath))
  }

  async seasonUpcomingFixtureSetDocuments(seasonId: string, take?: number) {
    if (!(await fixtureIndexStatusDAO.isComplete(seasonId))) return undefined

    return (
      await this.entities(this.seasonUpcomingQuery(seasonId, currentLocalDate().toString(), take))
    ).map((entry) => FixturesDAO.getByPath(entry.fixtureSetPath))
  }

  async seasonFixtureSetDocumentsForDay(seasonId: string) {
    if (!(await fixtureIndexStatusDAO.isComplete(seasonId))) return undefined

    const entries = await this.entities(this.seasonQuery(seasonId, currentLocalDate().toString()))
    if (!entries.length) return []
    const latestDate = entries[0].fixtureSetDate
    return entries
      .filter((entry) => entry.fixtureSetDate === latestDate)
      .map((entry) => FixturesDAO.getByPath(entry.fixtureSetPath))
  }

  async competitionFixtureSetDocuments(competitionPath: string, take?: number) {
    const seasonId = seasonIdFromCompetitionPath(competitionPath)
    if (!seasonId || !(await fixtureIndexStatusDAO.isComplete(seasonId))) return undefined

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
    ).map((entry) => FixturesDAO.getByPath(entry.fixtureSetPath))
  }

  async competitionUpcomingFixtureSetDocuments(competitionPath: string, take?: number) {
    const seasonId = seasonIdFromCompetitionPath(competitionPath)
    if (!seasonId || !(await fixtureIndexStatusDAO.isComplete(seasonId))) return undefined

    return (
      await this.entities(
        withOptionalLimit(
          query(
            this.collection(),
            where('competitionPath', '==', competitionPath),
            where('fixtureSetDate', '>=', currentLocalDate().toString()),
            orderBy('fixtureSetDate', 'asc'),
          ),
          take,
        ),
      )
    ).map((entry) => FixturesDAO.getByPath(entry.fixtureSetPath))
  }

  async teamFixtureDocuments(teamId: string, seasonId: string, take?: number) {
    if (!(await fixtureIndexStatusDAO.isComplete(seasonId))) return undefined

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
      .flatMap((entry) => entry.fixtures)
      .filter((fixture) => fixture.homeTeamId === teamId || fixture.awayTeamId === teamId)
      .slice(0, take)
      .map((fixture) => fixtureDAO.getByPath(fixture.fixturePath))
  }

  private seasonQuery(seasonId: string, today: string, take?: number) {
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

  private seasonUpcomingQuery(seasonId: string, today: string, take?: number) {
    return withOptionalLimit(
      query(
        this.collection(),
        where('seasonId', '==', seasonId),
        where('firstClass', '==', true),
        where('fixtureSetDate', '>=', today),
        orderBy('fixtureSetDate', 'asc'),
      ),
      take,
    )
  }
}

class CompleteFixtureIndexStatusDAO extends FixtureIndexStatusDAO {
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

export const fixtureIndexStatusDAO = new CompleteFixtureIndexStatusDAO()

export default new FixtureIndexDAO()
