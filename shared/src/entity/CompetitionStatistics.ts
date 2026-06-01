import type Entity from './Entity'
import type { FirestoreDocumentRef, LegacyRef } from './PathAndId'

export type CompetitionStatisticsReference = FirestoreDocumentRef | LegacyRef

export interface CompetitionStatistics extends Entity {
  competitionName: string
  results: CompetitionStatisticsResult[]
}

export interface CompetitionStatisticsResult {
  competition?: CompetitionStatisticsReference
  season?: CompetitionStatisticsReference
  seasonText: string
  team?: CompetitionStatisticsReference
  teamText: string
}
