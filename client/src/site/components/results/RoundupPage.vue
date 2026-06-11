<template>
  <v-container v-if="roundups" fluid class="roundup-page">
    <v-row v-if="roundups.length > 0">
      <v-col v-for="roundup in roundups" :key="roundup.competition.path" cols="12">
        <v-card class="roundup-card elevation-1">
          <v-card-title class="roundup-title">
            <v-icon color="primary" size="20" class="mr-2">mdi-auto-awesome</v-icon>
            <span>{{ roundup.competition.name }}</span>
          </v-card-title>
          <v-card-text class="pt-0">
            <QlMarkdown :text="roundup.text.text" />
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
    <v-sheet v-else class="pa-4 text-medium-emphasis">
      No roundups are available for this season.
    </v-sheet>
  </v-container>
</template>

<script setup lang="ts">
import { useCompetitions } from '@/services/CompetitionService'
import { useResultsStore } from '@/stores/results'
import { usePromise } from '@/utils/PromiseRef'
import QlMarkdown from '../text/QlMarkdown.vue'

const { seasonId } = useResultsStore()
const { roundups: fetchRoundups } = useCompetitions()

const roundups = usePromise(() => fetchRoundups(`${seasonId?.value}`))
</script>

<style scoped>
.roundup-page {
  padding: 16px;
}

.roundup-card {
  border-radius: 8px;
}

.roundup-title {
  align-items: center;
  display: flex;
  font-size: 1.1rem;
  font-weight: 700;
  line-height: 1.3;
}
</style>
