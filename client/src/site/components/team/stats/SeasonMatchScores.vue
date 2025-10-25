<template>
  <LineChart :data-fn="matchScoresData" title="Match Scores" :stats="stats" />
</template>
<script setup lang="ts">
import LineChart from './LineChart.vue';
import Statistics from '@/entity/Statisitics';
import { useTeams } from '@/services/TeamService';

defineProps<{ stats: Statistics }>()

const { matchScoresData } = useTeams()
</script>
