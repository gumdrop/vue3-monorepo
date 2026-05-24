<template>
  <LineChart :data-fn="cumulativeScoresData" title="Cumulative Match Scores" :stats="stats" />
</template>
<script setup lang="ts">
import LineChart from './LineChart.vue'
import type Statistics from '@/entity/Statisitics'
import { useTeams } from '@/services/TeamService'

defineProps<{ stats: Statistics }>()

const { cumulativeScoresData } = useTeams()
</script>
