<script setup lang="ts">
import FixturesSet from './FixturesSet.vue';
import { useCompetitions } from '@/services/CompetitionService';

defineProps<{ path: string }>()

const { latestResults } = useCompetitions()

</script>

<template>
  <FixturesSet :path="path" title="Latest Results" :fetch-function="latestResults" />
</template>
