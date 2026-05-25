import CompetitionStatisticsDAO from '@/dao/CompetitionStatisticsDAO'
import type CompetitionStatistics from '@/entity/CompetitionStatistics'
import { computed, type MaybeRefOrGetter, toValue } from 'vue'
import { useCollection } from 'vuefire'

export const competitionStatisticsSlug = (statistics: CompetitionStatistics) =>
  statistics.competitionName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || statistics.id

export const useCompetitionStatisticsEntries = () => {
  const statistics = useCollection(() => CompetitionStatisticsDAO.collection())

  const rollOfHonour = computed(() =>
    [...statistics.value].sort((left, right) =>
      left.competitionName.localeCompare(right.competitionName),
    ),
  )

  return { rollOfHonour }
}

export const useCompetitionStatisticsEntry = (id: MaybeRefOrGetter<string>) => {
  const { rollOfHonour } = useCompetitionStatisticsEntries()

  const statistics = computed(() => {
    const requestedId = toValue(id)
    const requestedSlug = requestedId.toLowerCase()

    return rollOfHonour.value.find(
      (entry) =>
        entry.id === requestedId ||
        entry.path.endsWith(`/${requestedId}`) ||
        competitionStatisticsSlug(entry) === requestedSlug,
    )
  })

  return { statistics }
}
