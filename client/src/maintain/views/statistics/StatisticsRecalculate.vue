<template>
  <v-container>
    <v-row>
      <v-col>
        <v-card>
          <v-card-title>Statistics</v-card-title>
          <v-card-text>
            <v-autocomplete
              v-model="selectedSeason"
              :items="seasonOptions"
              label="Season"
              item-title="label"
              item-value="id"
              :loading="loadingSeasons"
              :disabled="recalculating"
              return-object
              data-test="statistics-season"
            ></v-autocomplete>

            <v-alert v-if="successMessage" type="success" class="mt-4">
              {{ successMessage }}
            </v-alert>
            <v-alert v-if="errorMessage" type="error" class="mt-4">
              {{ errorMessage }}
            </v-alert>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn
              color="primary"
              :disabled="!selectedSeason || recalculating"
              @click="recalculate"
            >
              Recalculate Statistics
            </v-btn>
            <v-btn
              color="primary"
              variant="outlined"
              :disabled="!selectedSeason || recalculating"
              @click="recalculateAggregation"
            >
              Recalculate Aggregation
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import SeasonDAO from '@/dao/SeasonDAO'
import type Season from '@/entity/Season'
import axios from 'axios'
import { onMounted, ref } from 'vue'

interface SeasonOption {
  id: string
  label: string
  path: string
}

const loadingSeasons = ref(false)
const recalculating = ref(false)
const seasonOptions = ref<SeasonOption[]>([])
const selectedSeason = ref<SeasonOption | null>(null)
const successMessage = ref('')
const errorMessage = ref('')

onMounted(async () => {
  loadingSeasons.value = true
  try {
    seasonOptions.value = (await SeasonDAO.list())
      .sort((left, right) => Number(right.startYear) - Number(left.startYear))
      .map(seasonOption)
  } finally {
    loadingSeasons.value = false
  }
})

const seasonOption = (season: Season): SeasonOption => ({
  id: season.id,
  label: `${season.startYear}/${season.endYear}`,
  path: season.path,
})

const recalculate = async () => {
  if (!selectedSeason.value) return

  recalculating.value = true
  successMessage.value = ''
  errorMessage.value = ''

  try {
    await axios.post(
      `/rest/maintain/season/${encodeURIComponent(selectedSeason.value.id)}/statistics/recalculate`,
    )
    successMessage.value = `Statistics recalculated for ${selectedSeason.value.label}`
  } catch {
    errorMessage.value = 'Statistics recalculation failed'
  } finally {
    recalculating.value = false
  }
}

const recalculateAggregation = async () => {
  if (!selectedSeason.value) return

  recalculating.value = true
  successMessage.value = ''
  errorMessage.value = ''

  try {
    await axios.post(
      `/rest/maintain/season/${encodeURIComponent(
        selectedSeason.value.id,
      )}/statistics/aggregation/recalculate`,
    )
    successMessage.value = `Statistics aggregation recalculated for ${selectedSeason.value.label}`
  } catch {
    errorMessage.value = 'Statistics aggregation recalculation failed'
  } finally {
    recalculating.value = false
  }
}
</script>
