<template>
  <LineChart :data-fn="cumulativePointsDifferenceData" title="Cumulative Points Difference" :stats="stats"
    :options="{ plugins: { legend: { display: false } } }" />
</template>
<script setup lang="ts">
import LineChart from './LineChart.vue';
import Statistics from '@/entity/Statisitics';
import { useTeams } from '@/services/TeamService';

defineProps<{ stats: Statistics }>()

const { cumulativePointsDifferenceData } = useTeams()
</script>
