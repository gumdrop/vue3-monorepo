import type { DocumentReference } from 'firebase/firestore'
import type { CollectionProxy } from '@/dao/DAO'
import type Entity from './Entity'
import type Venue from './Venue'
import type Team from './Team'
import type User from './User'
import type Text from './Text'

export default class Fixtures implements Entity {
  constructor(
    public readonly id: string,
    public description: string,
    public date: string,
    public start: string,
    public fixture: CollectionProxy<Fixture>,
    public questionsUrl?: string,
    public readonly key?: string,
    public resultsSummary?: DocumentReference<Text>,
    public resultsSummaryGeneratedAt?: string,
    public resultsSummaryModel?: string,
  ) {}
  path: string = ''
}

export class Fixture implements Entity {
  constructor(
    public readonly id: string,
    public home: DocumentReference<Team>,
    public away: DocumentReference<Team>,
    public venue?: DocumentReference<Venue>,
    public result?: Result,
    public readonly key?: string,
  ) {}
  path: string = ''
}

export class Result {
  constructor(
    public homeScore: number,
    public awayScore: number,
    public report?: CollectionProxy<Report>,
    public submitter?: DocumentReference<User>,
    public note?: string,
  ) {}
}

export class Report implements Entity {
  constructor(
    public readonly id: string,
    public team: DocumentReference<Team>,
    public text: DocumentReference<Text>,
    public readonly key?: string,
  ) {}
  path: string = ''
}
