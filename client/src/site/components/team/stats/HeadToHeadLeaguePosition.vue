<template>
  <HeadToHeadLineChart :stats="stats" title="League Position" :data-fn="multipleTeamsAllSeasonsPositionData" :options="{
    scales: {
      y: { type: 'linear', reverse: true, min: 1, max: teamCount, ticks: { stepSize: 1 } }
    }
  }" />
</template>
<script setup lang="ts">
import Statistics from '@/entity/Statisitics';
import { useTeams } from '@/services/TeamService';
import { usePromise } from '@/utils/PromiseRef';
import HeadToHeadLineChart from './HeadToHeadLineChart.vue';

const props = defineProps<{ stats: Statistics[][] }>()

const { multipleTeamsAllSeasonsPositionData, teamCountAllSeasons: count } = useTeams()

const teamCount = usePromise(() => count(props.stats[0]))


</script>
