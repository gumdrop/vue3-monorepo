<template>
  <LineChart
    :key="chartKey"
    :data-fn="positionData"
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
import LineChart from './LineChart.vue'

const props = defineProps<{ stats: Statistics }>()

const { positionData, teamCount: count } = useTeams()

const teamCount = usePromise(() => count(props.stats))
const chartKey = computed(() => `${props.stats.id}-${teamCount.value ?? 'pending'}`)
const positionOptions = computed<ChartOptions<'line'>>(() => ({
  plugins: { legend: { display: false } },
  scales: {
    y: {
      type: 'linear',
      reverse: true,
      min: 1,
      max: teamCount.value,
      ticks: {
        stepSize: 1,
        count: teamCount.value,
        precision: 0,
        callback: (value) => (Number.isInteger(Number(value)) ? `${Number(value)}` : ''),
      },
    },
  },
}))
</script>
