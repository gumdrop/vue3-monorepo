<template>
  <v-card>
    <v-card-title>Results</v-card-title>
    <v-card-text v-if="stats && rows">
      <v-container fluid>
        <v-row justify="space-around">
          <v-data-table :headers="headers" :items="rows" hide-default-footer />
        </v-row>
      </v-container>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import type Statistics from '@/entity/Statisitics'
import { useTeams } from '@/services/TeamService'
import { usePromise } from '@/utils/PromiseRef'

const props = defineProps<{ stats: Statistics[][] }>()

const { headToHeadResultsData } = useTeams()

const rows = usePromise(() => headToHeadResultsData(props.stats))

const headers = [
  { title: 'Team', value: 'team' },
  { title: 'Won', value: 'win', sortable: true },
  { title: 'Lost', value: 'lose', sortable: true },
  { title: 'Drawn', value: 'draw', sortable: true },
]
</script>
