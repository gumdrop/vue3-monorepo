<template>
  <table>
    <TeamStandingLine v-for="s in standings" :standing="s" :key="`${s.name}${teamId}`" />
  </table>
</template>
<script setup lang="ts">
import { useTeams } from '@/services/TeamService';
import { usePromise } from '@/utils/PromiseRef';
import TeamStandingLine from './TeamStandingLine.vue';

const { standings: standingsFn } = useTeams()

const { teamId } = defineProps<{ teamId: string }>()

const standings = usePromise(() => standingsFn(teamId))
</script>
