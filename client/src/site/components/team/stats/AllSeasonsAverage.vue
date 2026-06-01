<template>
  <AllSeasonsLineChart :data-fn="allSeasonsAverageData" title="Average Scores" :stats="stats" />
</template>
<script setup lang="ts">
import type Statistics from '@/entity/Statisitics'
import { useTeams } from '@/services/TeamService'
import AllSeasonsLineChart from './AllSeasonsLineChart.vue'

defineProps<{ stats: Statistics[] }>()

const { allSeasonsAverageData } = useTeams()
</script>
