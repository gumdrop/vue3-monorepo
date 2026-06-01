<template>
  <RouterLink v-if="teamId" :to="`/team/${teamId}`">{{ teamName }}</RouterLink>
  <span v-else>{{ teamName }}</span>
</template>

<script setup lang="ts">
import TeamDAO from '@/dao/TeamDAO'
import type { CompetitionStatisticsResult } from '@/entity/CompetitionStatistics'
import { computed } from 'vue'
import { useDocument } from 'vuefire'
import { referenceId, referencePath } from './competitionStatisticsRefs'

const props = defineProps<{
  result: CompetitionStatisticsResult
}>()

const teamPath = computed(() => referencePath(props.result.team))
const team = useDocument(() => (teamPath.value ? TeamDAO.getByPath(teamPath.value) : undefined))

const teamId = computed(() => team.value?.id ?? referenceId(props.result.team))
const teamName = computed(() => team.value?.name ?? props.result.teamText)
</script>
