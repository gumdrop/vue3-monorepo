<template>
  <HeadToHeadLineChart
    :stats="stats"
    title="Average Scores"
    :dataFn="multipleTeamsAllSeasonsAverageData"
  />
</template>
<script setup lang="ts">
import type Statistics from '@/entity/Statisitics'
import { useTeams } from '@/services/TeamService'
import HeadToHeadLineChart from './HeadToHeadLineChart.vue'

defineProps<{ stats: Statistics[][] }>()

const { multipleTeamsAllSeasonsAverageData } = useTeams()
</script>
