<template>
  <LineChart :data-fn="positionData" :options="{
    plugins: { legend: { display: false } },
    scales: { y: { type: 'linear', reverse: true, min: 1, max: teamCount, ticks: { stepSize: 1 } } }
  }" title="League Position" :stats="stats" />
</template>
<script setup lang="ts">
import Statistics from '@/entity/Statisitics';
import { useTeams } from '@/services/TeamService';
import { usePromise } from '@/utils/PromiseRef';
import LineChart from './LineChart.vue';

const props = defineProps<{ stats: Statistics }>()

const { positionData, teamCount: count } = useTeams()

const teamCount = usePromise(() => count(props.stats))

</script>
