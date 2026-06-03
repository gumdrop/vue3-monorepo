<template>
  <v-container>
    <v-row v-if="!seasonId" justify="center" class="mt-12">
      <v-col cols="12" class="text-center">
        <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
        <div class="mt-4 text-grey">Loading application context...</div>
      </v-col>
    </v-row>

    <v-row v-else>
      <v-col cols="12" md="6">
        <!-- We pass seasonId here, but we want it to show even if it's not yet set if we had seasons. 
             Since seasonId is now guaranteed to be set if we reach here, SeasonSelect should show. -->
        <SeasonSelect :season-id="seasonId" @season="setSeason" :inline="false" label="Select Season" />
      </v-col>
      <v-col cols="12" md="6" v-if="aggregation">
        <v-select
          v-model="selectedCompetitionId"
          :items="competitions"
          item-title="competitionName"
          item-value="competitionId"
          label="Select Competition"
          prepend-inner-icon="mdi-trophy"
          variant="outlined"
        ></v-select>
      </v-col>
    </v-row>

    <div v-if="seasonId">
      <v-row v-if="aggregation === undefined" justify="center" class="mt-12">
        <v-col cols="12" class="text-center">
          <v-progress-circular indeterminate color="primary" size="48"></v-progress-circular>
          <div class="mt-4 text-grey">Loading analytics data...</div>
        </v-col>
      </v-row>

      <v-row v-else-if="selectedCompetition">
        <v-col cols="12">
          <v-card class="mb-6 elevation-1" rounded="lg">
            <v-card-text>
              <div class="d-flex flex-column ga-4">
                <div class="d-flex justify-space-between align-center">
                  <div class="text-h6 font-weight-bold">
                    {{ currentSnapshot?.fixtureSetDescription }}
                    <span class="text-subtitle-1 text-grey-darken-1 font-weight-regular ml-2">
                      ({{ currentSnapshot?.fixtureSetDate }})
                    </span>
                  </div>
                  <div class="text-caption text-grey">
                    Snapshot {{ snapshotIndex + 1 }} of {{ selectedCompetition.tableSnapshots.length }}
                  </div>
                </div>

                <v-slider
                  v-model="snapshotIndex"
                  :max="selectedCompetition.tableSnapshots.length - 1"
                  :step="1"
                  show-ticks="always"
                  thumb-label
                  color="primary"
                  track-color="primary-lighten-4"
                  class="px-2"
                >
                  <template v-slot:thumb-label="{ modelValue }">
                    {{ selectedCompetition.tableSnapshots[modelValue].fixtureSetDescription }}
                  </template>
                </v-slider>

                <div class="d-flex justify-center align-center ga-2">
                  <v-btn icon="mdi-skip-backward" variant="tonal" size="small" @click="snapshotIndex = 0" :disabled="snapshotIndex === 0"></v-btn>
                  <v-btn icon="mdi-chevron-left" variant="tonal" @click="snapshotIndex = Math.max(0, snapshotIndex - 1)" :disabled="snapshotIndex === 0"></v-btn>
                  
                  <v-btn 
                    :icon="isPlaying ? 'mdi-pause' : 'mdi-play'" 
                    color="primary" 
                    size="large"
                    @click="togglePlay"
                  ></v-btn>

                  <v-btn icon="mdi-chevron-right" variant="tonal" @click="snapshotIndex = Math.min(selectedCompetition.tableSnapshots.length - 1, snapshotIndex + 1)" :disabled="snapshotIndex === selectedCompetition.tableSnapshots.length - 1"></v-btn>
                  <v-btn icon="mdi-skip-forward" variant="tonal" size="small" @click="snapshotIndex = selectedCompetition.tableSnapshots.length - 1" :disabled="snapshotIndex === selectedCompetition.tableSnapshots.length - 1"></v-btn>
                </div>
              </div>
            </v-card-text>
          </v-card>

          <div v-for="table in currentSnapshot?.tables" :key="table.table.id">
            <v-slide-y-transition mode="out-in">
              <div class="league-table-container mb-6 elevation-2" :key="snapshotIndex">
                <table class="ql-league-table">
                  <caption v-if="table.description" class="pa-4 font-weight-bold">{{ table.description }}</caption>
                  <thead>
                    <tr>
                      <th class="text-center">Pos</th>
                      <th class="text-left">Team</th>
                      <th class="text-center">Pl</th>
                      <th class="text-center">W</th>
                      <th class="text-center">D</th>
                      <th class="text-center">L</th>
                      <th class="text-center">S</th>
                      <th class="text-center">Pts</th>
                    </tr>
                  </thead>
                  <tbody>
                    <LeagueTableRow
                      :row="row"
                      v-for="(row, index) in table.rows"
                      :key="row.team.id || index"
                    />
                  </tbody>
                </table>
              </div>
            </v-slide-y-transition>
          </div>
        </v-col>
      </v-row>

      <v-row v-else-if="aggregation && !selectedCompetitionId" justify="center" class="mt-12">
        <v-col cols="12" md="6" class="text-center">
          <v-icon size="64" color="grey-lighten-1" class="mb-4">mdi-chart-line</v-icon>
          <div class="text-h5 text-grey-darken-1">Select a competition to view analytics</div>
        </v-col>
      </v-row>
      
      <v-row v-else-if="aggregation === null" justify="center" class="mt-12">
        <v-col cols="12" md="6" class="text-center">
          <v-icon size="64" color="grey-lighten-1" class="mb-4">mdi-alert-circle-outline</v-icon>
          <div class="text-h5 text-grey-darken-1">No analytics data available for this season</div>
        </v-col>
      </v-row>
    </div>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, watch, onBeforeUnmount } from 'vue'
import { useDocument } from 'vuefire'
import ApplicationContextDAO from '@/dao/ApplicationContextDAO'
import SeasonStatisticsAggregationDAO from '@/dao/SeasonStatisticsAggregationDAO'
import SeasonSelect from '../season/SeasonSelect.vue'
import LeagueTableRow from '../leaguetable/LeagueTableRow.vue'

const appContext = useDocument(ApplicationContextDAO.get())
const seasonId = ref<string>()

watch(appContext, (ctx) => {
  if (ctx && !seasonId.value) {
    seasonId.value = ctx.currentSeason.id
  }
})

const setSeason = (id: string) => {
  seasonId.value = id
}

const aggregation = useDocument(() => seasonId.value ? SeasonStatisticsAggregationDAO.getById(seasonId.value) : undefined)

const competitions = computed(() => {
  if (!aggregation.value) return []
  return aggregation.value.competitions
    .filter(c => c.tableSnapshots && c.tableSnapshots.length > 0)
    .map(c => ({
      competitionName: c.competitionName,
      competitionId: c.competition.id
    }))
})

const selectedCompetitionId = ref<string>()

const selectedCompetition = computed(() => {
  if (!aggregation.value || !selectedCompetitionId.value) return undefined
  return aggregation.value.competitions.find(c => c.competition.id === selectedCompetitionId.value)
})

const snapshotIndex = ref(0)
const isPlaying = ref(false)
let playInterval: number | null = null

watch(selectedCompetition, (comp) => {
  if (comp) {
    snapshotIndex.value = 0
  } else {
    snapshotIndex.value = 0
  }
  stopPlay()
})

const currentSnapshot = computed(() => {
  if (!selectedCompetition.value) return undefined
  return selectedCompetition.value.tableSnapshots[snapshotIndex.value]
})

const togglePlay = () => {
  if (isPlaying.value) {
    stopPlay()
  } else {
    startPlay()
  }
}

const startPlay = () => {
  if (!selectedCompetition.value) return
  
  if (snapshotIndex.value === selectedCompetition.value.tableSnapshots.length - 1) {
    snapshotIndex.value = 0
  }
  
  isPlaying.value = true
  playInterval = window.setInterval(() => {
    if (selectedCompetition.value && snapshotIndex.value < selectedCompetition.value.tableSnapshots.length - 1) {
      snapshotIndex.value++
    } else {
      stopPlay()
    }
  }, 1500)
}

const stopPlay = () => {
  isPlaying.value = false
  if (playInterval) {
    clearInterval(playInterval)
    playInterval = null
  }
}

onBeforeUnmount(() => {
  stopPlay()
})

</script>

<style scoped>
.league-table-container {
  background-color: white;
  border-radius: 12px;
  overflow: hidden;
}

.ql-league-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
  line-height: 1.5;
}

caption {
  text-align: left;
  font-size: 1.1rem;
  color: #1a1a1a;
  background-color: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
}

th {
  background-color: #f8fafc;
  color: #64748b;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 12px 16px;
  border-bottom: 2px solid #e2e8f0;
}

.text-center {
  text-align: center;
}

.text-left {
  text-align: left;
}

@media (max-width: 600px) {
  .ql-league-table {
    font-size: 13px;
  }
  th {
    padding: 10px 8px;
  }
}
</style>
