<template>
  <v-container>
    <AnalyticsSelector
      :season-id="seasonId"
      :competition-id="competitionId"
      :aggregation="aggregation"
      :competitions="competitions"
      @season="setSeason"
      @competition="setCompetition"
    />

    <div v-if="seasonId">
      <v-row v-if="aggregation === undefined" justify="center" class="mt-12">
        <v-col cols="12" class="text-center">
          <v-progress-circular indeterminate color="primary" size="48"></v-progress-circular>
          <div class="mt-4 text-grey">Loading analytics data...</div>
        </v-col>
      </v-row>

      <v-row v-else-if="selectedCompetition && hasReplaySelectedCompetition">
        <v-col cols="12">
          <v-card class="mb-6 elevation-1" rounded="lg" data-test="analytics-replay">
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
                    Snapshot {{ snapshotIndex + 1 }} of
                    {{ selectedCompetition.tableSnapshots.length }}
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
                  <v-btn
                    icon="mdi-skip-backward"
                    variant="tonal"
                    size="small"
                    @click="snapshotIndex = 0"
                    :disabled="snapshotIndex === 0"
                  ></v-btn>
                  <v-btn
                    icon="mdi-chevron-left"
                    variant="tonal"
                    @click="snapshotIndex = Math.max(0, snapshotIndex - 1)"
                    :disabled="snapshotIndex === 0"
                  ></v-btn>

                  <v-btn
                    :icon="isPlaying ? 'mdi-pause' : 'mdi-play'"
                    color="primary"
                    size="large"
                    @click="togglePlay"
                  ></v-btn>

                  <v-btn
                    icon="mdi-chevron-right"
                    variant="tonal"
                    @click="
                      snapshotIndex = Math.min(
                        selectedCompetition.tableSnapshots.length - 1,
                        snapshotIndex + 1,
                      )
                    "
                    :disabled="snapshotIndex === selectedCompetition.tableSnapshots.length - 1"
                  ></v-btn>
                  <v-btn
                    icon="mdi-skip-forward"
                    variant="tonal"
                    size="small"
                    @click="snapshotIndex = selectedCompetition.tableSnapshots.length - 1"
                    :disabled="snapshotIndex === selectedCompetition.tableSnapshots.length - 1"
                  ></v-btn>
                </div>
              </div>
            </v-card-text>
          </v-card>

          <div
            v-for="(table, tableIndex) in currentSnapshot?.tables"
            :key="tableKey(table, tableIndex)"
          >
            <div class="league-table-container mb-6 elevation-2">
              <table class="ql-league-table">
                <caption v-if="table.description" class="pa-4 font-weight-bold">
                  {{
                    table.description
                  }}
                </caption>
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
                <TransitionGroup tag="tbody" name="analytics-table-row">
                  <LeagueTableRow
                    :row="row"
                    v-for="(row, index) in table.rows"
                    :key="rowKey(row, index)"
                  />
                </TransitionGroup>
              </table>
            </div>
          </div>
        </v-col>
      </v-row>

      <v-row
        v-else-if="selectedCompetition && !hasReplaySelectedCompetition"
        justify="center"
        class="mt-12"
      >
        <v-col cols="12" md="6" class="text-center">
          <v-icon size="64" color="grey-lighten-1" class="mb-4">mdi-play-box-outline</v-icon>
          <div class="text-h5 text-grey-darken-1">
            No replay data available for this competition
          </div>
        </v-col>
      </v-row>

      <v-row v-else-if="aggregation && !competitionId" justify="center" class="mt-12">
        <v-col cols="12" md="6" class="text-center">
          <v-icon size="64" color="grey-lighten-1" class="mb-4">mdi-chart-timeline-variant</v-icon>
          <div class="text-h5 text-grey-darken-1">Select a competition to view replay</div>
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
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import type {
  LeagueTableRow as LeagueTableRowData,
  LeagueTableSnapshotTable,
} from '@quizleague/shared'
import AnalyticsSelector from './AnalyticsSelector.vue'
import LeagueTableRow from '../leaguetable/LeagueTableRow.vue'
import { hasReplayPane, referenceId, useAnalyticsSelection } from './analyticsState'

const {
  seasonId,
  competitionId,
  aggregation,
  competitions,
  selectedCompetition,
  setSeason,
  setCompetition,
} = useAnalyticsSelection()

const snapshotIndex = ref(0)
const isPlaying = ref(false)
let playInterval: number | null = null

const hasReplaySelectedCompetition = computed(() => hasReplayPane(selectedCompetition.value))

watch(selectedCompetition, () => {
  snapshotIndex.value = 0
  stopPlay()
})

const currentSnapshot = computed(() => {
  if (!selectedCompetition.value || !hasReplaySelectedCompetition.value) return undefined
  return selectedCompetition.value.tableSnapshots[snapshotIndex.value]
})

const tableKey = (table: LeagueTableSnapshotTable, index: number) =>
  referenceId(table.table) || `${index}`

const rowKey = (row: LeagueTableRowData, index: number) => referenceId(row.team) || `${index}`

const togglePlay = () => {
  if (isPlaying.value) {
    stopPlay()
  } else {
    startPlay()
  }
}

const startPlay = () => {
  if (!selectedCompetition.value || !hasReplaySelectedCompetition.value) return

  if (snapshotIndex.value === selectedCompetition.value.tableSnapshots.length - 1) {
    snapshotIndex.value = 0
  }

  isPlaying.value = true
  playInterval = window.setInterval(() => {
    if (
      selectedCompetition.value &&
      snapshotIndex.value < selectedCompetition.value.tableSnapshots.length - 1
    ) {
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

.analytics-table-row-move,
.analytics-table-row-enter-active,
.analytics-table-row-leave-active {
  transition:
    opacity 0.54s ease,
    transform 0.72s ease;
}

.analytics-table-row-enter-from,
.analytics-table-row-leave-to {
  opacity: 0;
  transform: translateY(8px);
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
