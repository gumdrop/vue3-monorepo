<template>
  <RouterLink v-if="competitionRoute" :to="competitionRoute">{{ result.seasonText }}</RouterLink>
  <span v-else>{{ result.seasonText }}</span>
</template>

<script setup lang="ts">
import CompetitionDAO from '@/dao/CompetitionDAO'
import type { CompetitionStatisticsResult } from '@/entity/CompetitionStatistics'
import { useKey } from '@/services/KeyService'
import { computed } from 'vue'
import { useDocument } from 'vuefire'
import { referencePath } from './competitionStatisticsRefs'

const props = defineProps<{
  result: CompetitionStatisticsResult
}>()

const { encode } = useKey()

const competitionPath = computed(() => referencePath(props.result.competition))
const competition = useDocument(() =>
  competitionPath.value ? CompetitionDAO.getByPath(competitionPath.value) : undefined,
)

const competitionRoute = computed(() =>
  competition.value && competitionPath.value
    ? `/competition/${encode(competitionPath.value)}/${competition.value._name}`
    : '',
)
</script>
