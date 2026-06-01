<template>
  <AllSeasonsLineChart
    v-if="teamCount"
    :data-fn="allSeasonsPositionData"
    :options="positionOptions"
    title="League Position"
    :stats="stats"
  />
</template>
<script setup lang="ts">
import type Statistics from '@/entity/Statisitics'
import { useTeams } from '@/services/TeamService'
import { usePromise } from '@/utils/PromiseRef'
import type { ChartOptions } from 'chart.js/auto'
import { computed } from 'vue'
import AllSeasonsLineChart from './AllSeasonsLineChart.vue'

const props = defineProps<{ stats: Statistics[] }>()

const { allSeasonsPositionData, teamCountAllSeasons: count } = useTeams()

const teamCount = usePromise(() => count(props.stats))
const positionOptions = computed<ChartOptions<'line'>>(() => ({
  plugins: { legend: { display: false } },
  scales: {
    y: { type: 'linear', reverse: true, min: 1, max: teamCount.value || 20, ticks: { stepSize: 1 } },
  },
}))
</script>
