import type { CompetitionStatisticsAggregation } from '@quizleague/shared'
import SeasonStatisticsAggregationDAO from '@/dao/SeasonStatisticsAggregationDAO'
import { useAnalyticsStore } from '@/stores/analytics'
import { storeToRefs } from 'pinia'
import { computed } from 'vue'
import { useDocument } from 'vuefire'

type InternalFirestorePath = {
  canonicalString?: () => string
  segments?: string[]
}

type ReferenceLike = {
  id?: unknown
  path?: unknown
  _path?: InternalFirestorePath
  _key?: {
    path?: InternalFirestorePath
  }
}

export type AnalyticsCompetitionOption = {
  competitionName: string
  competitionId: string
}

export const stringValue = (value: unknown) => {
  const resolved = Array.isArray(value) ? value[0] : value
  return typeof resolved === 'string' ? resolved : ''
}

export const hasReplayPane = (competition?: CompetitionStatisticsAggregation) =>
  Boolean(competition?.tableSnapshots?.length)

export const useAnalyticsSelection = () => {
  const analyticsStore = useAnalyticsStore()
  const { seasonId, competitionId } = storeToRefs(analyticsStore)

  const aggregation = useDocument(() =>
    seasonId.value ? SeasonStatisticsAggregationDAO.getById(seasonId.value) : undefined,
  )

  const competitions = computed<AnalyticsCompetitionOption[]>(() => {
    if (!aggregation.value) return []

    return aggregation.value.competitions.map((competition) => ({
      competitionName: competition.competitionName,
      competitionId: competition.competitionName,
    }))
  })

  const selectedCompetition = computed(() => {
    if (!aggregation.value || !competitionId.value) return undefined

    return aggregation.value.competitions.find(
      (competition) => competition.competitionName === competitionId.value,
    )
  })

  return {
    seasonId,
    competitionId,
    aggregation,
    competitions,
    selectedCompetition,
    setSeason: analyticsStore.setSeason,
    setCompetition: analyticsStore.setCompetition,
  }
}

const pathFromSegments = (segments: string[]) => {
  const documentsIndex = segments.indexOf('documents')
  const documentPathSegments = documentsIndex >= 0 ? segments.slice(documentsIndex + 1) : segments

  return documentPathSegments.join('/')
}

const internalPath = (path?: InternalFirestorePath) => {
  if (!path) return ''

  if (typeof path.canonicalString === 'function') {
    return path.canonicalString()
  }

  return Array.isArray(path.segments) ? pathFromSegments(path.segments) : ''
}

export const referenceId = (reference: unknown) => {
  if (!reference || typeof reference !== 'object') return ''

  const referenceLike = reference as ReferenceLike
  if (typeof referenceLike.id === 'string') return referenceLike.id

  const path =
    (typeof referenceLike.path === 'string' ? referenceLike.path : '') ||
    internalPath(referenceLike._path) ||
    internalPath(referenceLike._key?.path)
  const pathParts = path.split('/').filter(Boolean)
  return pathParts[pathParts.length - 1] ?? ''
}
