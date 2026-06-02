<template>
  <v-card class="mb-x">
    <v-card-title>League Table</v-card-title>
    <v-card-text>
      <LeagueTable v-for="table in tables" :key="table.id" :path="table.path" class="mb-3" />
    </v-card-text>
  </v-card>
</template>
<script setup lang="ts">
import { useCompetitions } from '@/services/CompetitionService';
import { useCollection } from 'vuefire';
import LeagueTable from '../leaguetable/LeagueTable.vue';
const { leagueTables } = useCompetitions()

const props = defineProps<{ path: string }>()
const tables = useCollection(() => leagueTables(props.path), { maxRefDepth: 0 })
</script>
