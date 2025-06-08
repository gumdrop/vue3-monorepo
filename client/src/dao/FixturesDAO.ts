import Fixtures, { Fixture, Report, Result } from '@/entity/Fixtures'
import DAO from './DAO'
import DataConverter from './DataConverter'
import type { DocumentData } from 'firebase/firestore'
import TeamDAO from './TeamDAO'
import VenueDAO from './VenueDAO'
import TextDAO from './TextDAO'
import UserDAO from './UserDAO'

class ReportDAO extends DAO<Report> {
  constructor() {
    super('report')
  }

  converter = new ReportConverter()
}

class ReportConverter extends DataConverter<Report> {
  buildObject(data: DocumentData, key: string): Report {
    return new Report(
      data.id,
      this.makeDocumentRef(data.team, TeamDAO.converter),
      this.makeDocumentRef(data.text, TextDAO.converter),
      key,
    )
  }
}

export const reportDAO = new ReportDAO()

class FixtureDAO extends DAO<Fixture> {
  constructor() {
    super('fixture')
  }

  converter = new FixtureConverter()
}

export class FixtureConverter extends DataConverter<Fixture> {
  buildObject(data: DocumentData, key: string): Fixture {
    const result = data.result

    const resultC = result
      ? new Result(
          result.homeScore,
          result.awayScore,
          reportDAO.collectionProxy(key),
          this.makeDocumentRef(result.submitter, UserDAO.converter),
          result.note,
        )
      : undefined

    return new Fixture(
      data.id,
      this.makeDocumentRef(data.home, TeamDAO.converter),
      this.makeDocumentRef(data.away, TeamDAO.converter),
      this.makeDocumentRef(data.venue, VenueDAO.converter),
      resultC,
      key,
    )
  }
}

export const fixtureDAO = new FixtureDAO()

class FixturesDAO extends DAO<Fixtures> {
  constructor() {
    super('fixtures')
  }

  converter = new FixturesConverter()
}

class FixturesConverter extends DataConverter<Fixtures> {
  buildObject(data: DocumentData, key: string): Fixtures {
    return new Fixtures(
      data.id,
      data.description,
      data.date,
      data.start,
      fixtureDAO.collectionProxy(key),
      data.questionsUrl,
      key,
    )
  }
}

export default new FixturesDAO()
