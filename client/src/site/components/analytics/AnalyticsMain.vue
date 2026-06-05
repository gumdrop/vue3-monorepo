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

      <v-row v-else-if="selectedCompetition">
        <v-col cols="12">
          <section class="analytics-overview elevation-1" data-test="analytics-overview">
            <div class="analytics-overview-header">
              <div>
                <div id="analytics-overview-title" class="text-h5 font-weight-bold">
                  {{ selectedCompetition.competitionName }}
                </div>
                <div class="text-body-2 text-grey-darken-1" v-if="formattedGeneratedAt">
                  Generated {{ formattedGeneratedAt }}
                </div>
              </div>
              <v-chip
                :color="selectedCompetition.complete ? 'success' : 'warning'"
                variant="tonal"
                class="analytics-status-chip"
              >
                {{ completionLabel }}
              </v-chip>
            </div>

            <div class="analytics-metric-grid">
              <div v-for="metric in overviewMetrics" :key="metric.label" class="analytics-metric">
                <v-icon color="primary" size="28">{{ metric.icon }}</v-icon>
                <div>
                  <div class="analytics-metric-label">{{ metric.label }}</div>
                  <div class="analytics-metric-value">{{ metric.value }}</div>
                </div>
              </div>
            </div>

            <table class="analytics-summary-table">
              <tbody>
                <tr v-for="row in overviewRows" :key="row.label">
                  <th>{{ row.label }}</th>
                  <td>{{ row.value }}</td>
                </tr>
              </tbody>
            </table>
          </section>
        </v-col>
      </v-row>

      <v-row v-else-if="aggregation && !competitionId" justify="center" class="mt-12">
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
import { computed } from 'vue'
import AnalyticsSelector from './AnalyticsSelector.vue'
import { referenceId, useAnalyticsSelection } from './analyticsState'

const {
  seasonId,
  competitionId,
  aggregation,
  competitions,
  selectedCompetition,
  setSeason,
  setCompetition,
} = useAnalyticsSelection()

const numberValue = (value: number | undefined) => (Number.isFinite(value) ? Number(value) : 0)

const formatNumber = (value: number | undefined) => `${Math.round(numberValue(value))}`

const formattedGeneratedAt = computed(() => {
  if (!aggregation.value?.generatedAt) return ''

  const generatedAt = new Date(aggregation.value.generatedAt)
  if (Number.isNaN(generatedAt.getTime())) return aggregation.value.generatedAt

  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(generatedAt)
})

const winnerValue = computed(() => {
  if (!selectedCompetition.value) return ''
  if (!selectedCompetition.value.complete) return 'Pending'

  return (
    selectedCompetition.value.winnerText ||
    referenceId(selectedCompetition.value.winner) ||
    'No single winner'
  )
})

const completionLabel = computed(() => {
  if (!selectedCompetition.value) return ''
  if (selectedCompetition.value.complete) return 'Complete'
  if (selectedCompetition.value.fixtureSetCount === 0) return 'No fixture sets'

  return `${selectedCompetition.value.completedFixtureSetCount}/${selectedCompetition.value.fixtureSetCount} sets complete`
})

const overviewMetrics = computed(() => {
  if (!selectedCompetition.value) return []

  return [
    {
      label: 'Fixture sets complete',
      value: `${selectedCompetition.value.completedFixtureSetCount}/${selectedCompetition.value.fixtureSetCount}`,
      icon: 'mdi-calendar-check',
    },
    {
      label: 'Fixtures counted',
      value: `${selectedCompetition.value.fixtureCount}`,
      icon: 'mdi-counter',
    },
    {
      label: 'Average score',
      value: formatNumber(selectedCompetition.value.averageScore),
      icon: 'mdi-chart-line',
    },
    {
      label: 'Winner',
      value: winnerValue.value,
      icon: 'mdi-trophy-outline',
    },
  ]
})

const overviewRows = computed(() => {
  if (!selectedCompetition.value) return []

  return [
    {
      label: 'Status',
      value: selectedCompetition.value.complete ? 'Complete' : 'In progress',
    },
    {
      label: 'Fixture sets',
      value: `${selectedCompetition.value.completedFixtureSetCount} completed of ${selectedCompetition.value.fixtureSetCount}`,
    },
    {
      label: 'Fixtures',
      value: `${selectedCompetition.value.fixtureCount}`,
    },
    {
      label: 'Average score',
      value: formatNumber(selectedCompetition.value.averageScore),
    },
    {
      label: 'Average winning score',
      value: formatNumber(selectedCompetition.value.averageWinningScore),
    },
    {
      label: 'Average losing score',
      value: formatNumber(selectedCompetition.value.averageLosingScore),
    },
    {
      label: 'Winner',
      value: winnerValue.value,
    },
  ]
})
</script>

<style scoped>
.analytics-overview {
  background-color: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 24px;
}

.analytics-overview-header {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-start;
  margin-bottom: 24px;
}

.analytics-status-chip {
  flex: 0 0 auto;
}

.analytics-metric-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.analytics-metric {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 76px;
  padding: 16px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background-color: #f8fafc;
}

.analytics-metric-label {
  color: #64748b;
  font-size: 0.75rem;
  font-weight: 700;
  line-height: 1.35;
  text-transform: uppercase;
}

.analytics-metric-value {
  color: #1e293b;
  font-size: 1.4rem;
  font-weight: 700;
  line-height: 1.25;
}

.analytics-summary-table {
  width: 100%;
  border-collapse: collapse;
}

.analytics-summary-table th,
.analytics-summary-table td {
  padding: 12px 16px;
  border-top: 1px solid #e2e8f0;
}

.analytics-summary-table th {
  width: 34%;
  text-align: left;
  text-transform: none;
  letter-spacing: 0;
  font-size: 0.875rem;
  line-height: 1.4;
  color: #475569;
  background-color: transparent;
  border-bottom: 0;
}

.analytics-summary-table td {
  color: #1e293b;
  font-weight: 600;
}

@media (max-width: 600px) {
  .analytics-overview {
    padding: 16px;
  }

  .analytics-overview-header {
    flex-direction: column;
  }

  .analytics-summary-table th,
  .analytics-summary-table td {
    display: block;
    width: 100%;
    padding: 10px 0;
  }

  .analytics-summary-table td {
    padding-top: 0;
  }
}
</style>
