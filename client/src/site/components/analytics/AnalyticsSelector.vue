<template>
  <v-row v-if="!seasonId" justify="center" class="mt-12">
    <v-col cols="12" class="text-center">
      <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
      <div class="mt-4 text-grey">Loading application context...</div>
    </v-col>
  </v-row>

  <v-row v-else class="analytics-selector-row">
    <v-col cols="12" md="6" class="analytics-selector-col">
      <SeasonSelect
        :season-id="seasonId"
        @season="selectSeason"
        :inline="false"
        label="Select Season"
        class="analytics-season-select"
      />
    </v-col>
    <v-col cols="12" md="6" v-if="aggregation" class="analytics-selector-col">
      <v-select
        :model-value="competitionId"
        :items="competitions"
        item-title="competitionName"
        item-value="competitionId"
        label="Select Competition"
        bg-color="transparent"
        class="analytics-competition-select"
        @update:model-value="selectCompetition"
      ></v-select>
    </v-col>
  </v-row>
</template>

<script setup lang="ts">
import type { SeasonStatisticsAggregation } from '@quizleague/shared'
import SeasonSelect from '../season/SeasonSelect.vue'
import { stringValue, type AnalyticsCompetitionOption } from './analyticsState'

defineProps<{
  seasonId?: string
  competitionId?: string
  aggregation?: SeasonStatisticsAggregation | null
  competitions: AnalyticsCompetitionOption[]
}>()

const emit = defineEmits<{
  season: [id: string]
  competition: [id?: string]
}>()

const selectSeason = (seasonId: unknown) => {
  const id = stringValue(seasonId)
  if (id) {
    emit('season', id)
  }
}

const selectCompetition = (competitionId: unknown) => {
  const id = stringValue(competitionId)
  if (id) {
    emit('competition', id)
  }
}
</script>

<style scoped>
.analytics-selector-row {
  align-items: flex-start;
  font-family:
    'Inter',
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    Roboto,
    Helvetica,
    Arial,
    sans-serif;
}

.analytics-selector-col {
  display: flex;
  align-items: flex-start;
}

.analytics-selector-col :deep(.season-select) {
  display: block;
  width: 100%;
  margin: 0;
  font-family: inherit !important;
  font-size: inherit !important;
  font-weight: 400 !important;
  line-height: inherit !important;
  letter-spacing: 0 !important;
}

.analytics-selector-row :deep(.v-input),
.analytics-selector-row :deep(.v-field),
.analytics-selector-row :deep(.v-field__input),
.analytics-selector-row :deep(.v-select__selection),
.analytics-selector-row :deep(.v-select__selection-text) {
  font-family: inherit !important;
  font-size: 16px !important;
  font-weight: 400 !important;
  line-height: 24px !important;
  letter-spacing: 0 !important;
}

.analytics-selector-row :deep(.v-field-label) {
  font-family: inherit !important;
  font-weight: 400 !important;
  letter-spacing: 0 !important;
}

.analytics-selector-row :deep(.v-field-label--floating) {
  font-size: 12px !important;
  line-height: 18px !important;
}

.analytics-selector-row :deep(.v-field__overlay) {
  background-color: transparent !important;
}

.analytics-season-select,
.analytics-competition-select {
  width: 100%;
}
</style>
