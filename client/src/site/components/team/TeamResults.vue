<template>

  <FixturesSet :fetch-function="fetchFunction" :team-id="teamId" title="Results" :initial-fetch="5">
    <SeasonSelect v-if="seasonId" :seasonId="seasonId" :inline="true" @season="setSeason" style="top:1px"
      label="Season" />
  </FixturesSet>

</template>
<script setup lang="ts">
import { useFixture } from '@/services/FixtureService';
import { useTeamStore } from '@/stores/teams';
import FixturesSet from './FixturesSet.vue';
import { computed } from 'vue';
import SeasonSelect from '../season/SeasonSelect.vue';

defineProps<{ teamId: string }>()
const { seasonId, setSeason } = useTeamStore()
const { teamResults } = useFixture()

const fetchFunction = computed(() => (teamId: string, take?: number) => teamResults(teamId, `${seasonId.value}`, take))
</script>
