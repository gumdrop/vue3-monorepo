<script setup lang="ts">
import FixturesSet from './FixturesSet.vue';
import { useCompetitions } from '@/services/CompetitionService';

defineProps<{ path: string }>()

const { nextFixtures } = useCompetitions()

</script>

<template>
  <FixturesSet :path="path" title="Next Fixtures" :fetch-function="nextFixtures" />
</template>
