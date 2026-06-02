<template>
  <v-card class="mb-1" min-width="100%" :loading="!tables" elevation="0">
    <v-card-title primary-title>League Tables</v-card-title>
    <v-card-text v-if="tables">
      <v-container>
        <v-row v-for="table in tables" :key="table.id">
          <LeagueTable :path="table.path" />
        </v-row>
      </v-container>
    </v-card-text>
  </v-card>
</template>
<script setup lang="ts">
import { useCompetitions } from '@/services/CompetitionService';
import { usePromise } from '@/utils/PromiseRef';
import { useCollection } from 'vuefire';
import LeagueTable from '../leaguetable/LeagueTable.vue';

const { seasonId } = defineProps<{ seasonId: string }>()

const { competitionOfType, leagueTables } = useCompetitions()

const competition = usePromise(() => competitionOfType(seasonId, "league"))
const tables = useCollection(() => competition.value ? leagueTables(competition.value.path) : undefined, {
  maxRefDepth: 0,
})

</script>
