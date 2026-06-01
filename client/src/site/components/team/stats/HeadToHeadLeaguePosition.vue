<template>
  <HeadToHeadLineChart
    :stats="stats"
    title="League Position"
    :data-fn="multipleTeamsAllSeasonsPositionData"
    :options="positionOptions"
  />
</template>
<script setup lang="ts">
import type Statistics from '@/entity/Statisitics'
import { useTeams } from '@/services/TeamService'
import { usePromise } from '@/utils/PromiseRef'
import type { ChartOptions } from 'chart.js/auto'
import { computed } from 'vue'
import HeadToHeadLineChart from './HeadToHeadLineChart.vue'

const props = defineProps<{ stats: Statistics[][] }>()

const { multipleTeamsAllSeasonsPositionData, teamCountAllSeasons: count } = useTeams()

const teamCount = usePromise(() => count(props.stats[0]))
const positionOptions = computed<ChartOptions<'line'>>(() => ({
  scales: {
    y: { type: 'linear', reverse: true, min: 1, max: teamCount.value || 20, ticks: { stepSize: 1 } },
  },
}))
</script>
