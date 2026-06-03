import type Entity from './Entity'
import type { Competition } from './Competition'
import type { Fixtures } from './Fixtures'
import type { LeagueTable, LeagueTableRow } from './LeagueTable'
import type { PathAndId } from './PathAndId'
import type { Season } from './Season'
import type { Team } from './Team'

export interface SeasonStatisticsAggregation extends Entity {
  season: PathAndId<Season>
  generatedAt: string
  competitions: CompetitionStatisticsAggregation[]
}

export interface CompetitionStatisticsAggregation {
  competition: PathAndId<Competition>
  competitionName: string
  fixtureSetCount: number
  completedFixtureSetCount: number
  fixtureCount: number
  complete: boolean
  averageScore: number
  averageWinningScore: number
  averageLosingScore: number
  tableSnapshots: LeagueTableSnapshot[]
  winner?: PathAndId<Team>
  winnerText?: string
}

export interface LeagueTableSnapshot {
  fixtures: PathAndId<Fixtures>
  fixtureSetDescription: string
  fixtureSetDate: string
  tables: LeagueTableSnapshotTable[]
}

export interface LeagueTableSnapshotTable {
  table: PathAndId<LeagueTable>
  description?: string
  rows: LeagueTableRow[]
}
