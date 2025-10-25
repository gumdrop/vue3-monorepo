<template>

  <FixturesSet :fetch-function="fetchFunction" :team-id="teamId" title="Fixtures" :initial-fetch="5" />

</template>
<script setup lang="ts">
import FixturesSet from './FixturesSet.vue';
import { useFixture } from '@/services/FixtureService';

defineProps<{ teamId: string, }>
  ()
const { teamFixtures } = useFixture()

const fetchFunction = (teamId: string, take?: number) => teamFixtures(teamId, take)
</script>
