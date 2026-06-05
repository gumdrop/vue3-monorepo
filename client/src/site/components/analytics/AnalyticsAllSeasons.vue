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

      <v-row v-else-if="selectedCompetition && allSeasonRows.length">
        <v-col cols="12">
          <section class="analytics-all-seasons elevation-1" data-test="analytics-all-seasons">
            <div class="analytics-all-seasons-header">
              <div>
                <div id="analytics-all-seasons-title" class="text-h5 font-weight-bold">
                  {{ selectedCompetition.competitionName }}
                </div>
                <div class="text-body-2 text-grey-darken-1">All seasons</div>
              </div>
            </div>

            <div class="analytics-metric-grid">
              <div class="analytics-metric">
                <v-icon color="primary" size="28">mdi-calendar-range</v-icon>
                <div>
                  <div class="analytics-metric-label">Seasons counted</div>
                  <div class="analytics-metric-value">{{ allSeasonRows.length }}</div>
                </div>
              </div>
              <div class="analytics-metric">
                <v-icon color="primary" size="28">mdi-trophy-variant-outline</v-icon>
                <div>
                  <div class="analytics-metric-label">Different winners</div>
                  <div class="analytics-metric-value">{{ differentWinnerCount }}</div>
                </div>
              </div>
              <div class="analytics-metric">
                <v-icon color="primary" size="28">mdi-podium-gold</v-icon>
                <div>
                  <div class="analytics-metric-label">Most successful team(s)</div>
                  <div class="analytics-metric-value analytics-metric-value-wrap">
                    {{ mostSuccessfulTeamsLabel }}
                  </div>
                </div>
              </div>
              <div class="analytics-metric">
                <v-icon color="primary" size="28">mdi-chart-bell-curve</v-icon>
                <div>
                  <div class="analytics-metric-label">Highest average score</div>
                  <div class="analytics-metric-value analytics-metric-value-wrap">
                    {{ highestAverageScoreLabel }}
                  </div>
                </div>
              </div>
            </div>

            <div
              class="analytics-chart-panel"
              aria-labelledby="analytics-average-scores-title"
              data-test="analytics-average-scores-chart"
            >
              <div id="analytics-average-scores-title" class="analytics-panel-title">
                Average Scores
              </div>
              <div class="analytics-chart-container">
                <Line :data="averageScoresData" :options="averageScoresOptions" />
              </div>
            </div>
          </section>
        </v-col>
      </v-row>

      <v-row v-else-if="selectedCompetition" justify="center" class="mt-12">
        <v-col cols="12" md="6" class="text-center">
          <v-icon size="64" color="grey-lighten-1" class="mb-4">mdi-chart-line</v-icon>
          <div class="text-h5 text-grey-darken-1">
            No all-season analytics data available for this competition
          </div>
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
import type {
  CompetitionStatisticsAggregation,
  SeasonStatisticsAggregation,
  Team,
} from '@quizleague/shared'
import type { ChartData, ChartOptions } from 'chart.js'
import 'chart.js/auto'
import { computed } from 'vue'
import { Line } from 'vue-chartjs'
import SeasonStatisticsAggregationDAO from '@/dao/SeasonStatisticsAggregationDAO'
import TeamDAO from '@/dao/TeamDAO'
import { useCollection } from 'vuefire'
import AnalyticsSelector from './AnalyticsSelector.vue'
import { referenceId, useAnalyticsSelection } from './analyticsState'

type AllSeasonRow = {
  seasonId: string
  seasonLabel: string
  sortValue: number
  competition: CompetitionStatisticsAggregation
  winnerLabel: string
}

type TeamScoreTotal = {
  team: string
  points: number
  played: number
  average: number
}

const {
  seasonId,
  competitionId,
  aggregation,
  competitions,
  selectedCompetition,
  setSeason,
  setCompetition,
} = useAnalyticsSelection()

const allAggregations = useCollection<SeasonStatisticsAggregation>(
  () => SeasonStatisticsAggregationDAO.collection(),
  { maxRefDepth: 1 },
)

const allTeams = useCollection<Team>(() => TeamDAO.collection())

const teamNameMap = computed(() => {
  const map = new Map<string, string>()
  if (Array.isArray(allTeams.value)) {
    for (const team of allTeams.value) {
      if (team.id) {
        map.set(team.id, team.name)
      }
    }
  }
  return map
})

const numberValue = (value: number | undefined) => (Number.isFinite(value) ? Number(value) : 0)

const averageValue = (value: number | undefined) => Math.round(numberValue(value))

const seasonIdentity = (seasonAggregation: SeasonStatisticsAggregation) =>
  referenceId(seasonAggregation.season) || seasonAggregation.id || seasonAggregation.path || ''

const seasonSortValue = (seasonIdValue: string) => {
  const yearMatch = seasonIdValue.match(/(\d{4})[-/](\d{4})/)
  if (!yearMatch) return Number.MAX_SAFE_INTEGER

  return Number(yearMatch[1])
}

const seasonLabel = (seasonIdValue: string) => {
  const yearMatch = seasonIdValue.match(/(\d{4})[-/](\d{4})/)
  if (!yearMatch) return seasonIdValue

  return `${yearMatch[1]}/${yearMatch[2]}`
}

const winnerLabel = (competition: CompetitionStatisticsAggregation) => {
  const winnerId = referenceId(competition.winner)
  return competition.winnerText || teamNameMap.value.get(winnerId) || winnerId
}

const teamLabel = (team: unknown) => {
  const teamId =
    typeof team === 'string' ? (team.split('/').filter(Boolean).pop() ?? '') : referenceId(team)

  if (teamNameMap.value.has(teamId)) {
    return teamNameMap.value.get(teamId) ?? ''
  }

  if (!teamId) return ''

  return teamId
    .replace(/^team-/, '')
    .split('-')
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(' ')
}

const latestSnapshot = (competition: CompetitionStatisticsAggregation) =>
  [...competition.tableSnapshots].sort((left, right) =>
    left.fixtureSetDate.localeCompare(right.fixtureSetDate),
  )[competition.tableSnapshots.length - 1]

const allSeasonRows = computed<AllSeasonRow[]>(() => {
  if (!competitionId.value || !Array.isArray(allAggregations.value)) return []

  return allAggregations.value
    .map((seasonAggregation) => {
      const competition = seasonAggregation.competitions.find(
        (candidate) => candidate.competitionName === competitionId.value,
      )

      if (!competition) return undefined

      const season = seasonAggregation.season as unknown as Season
      const resolvedSeasonId = seasonIdentity(seasonAggregation)

      let label = seasonLabel(resolvedSeasonId)
      let sortValue = seasonSortValue(resolvedSeasonId)

      if (season && typeof season.startYear === 'number' && typeof season.endYear === 'number') {
        label = `${season.startYear}/${season.endYear}`
        sortValue = season.startYear
      }

      return {
        seasonId: resolvedSeasonId,
        seasonLabel: label,
        sortValue: sortValue,
        competition,
        winnerLabel: winnerLabel(competition),
      }
    })
    .filter((row): row is AllSeasonRow => Boolean(row))
    .sort((left, right) => {
      if (left.sortValue !== right.sortValue) return left.sortValue - right.sortValue

      return left.seasonLabel.localeCompare(right.seasonLabel)
    })
})

const winnerCounts = computed(() => {
  const counts = new Map<string, number>()

  for (const row of allSeasonRows.value) {
    if (!row.winnerLabel) continue

    counts.set(row.winnerLabel, (counts.get(row.winnerLabel) ?? 0) + 1)
  }

  return [...counts.entries()]
    .map(([team, count]) => ({ team, count }))
    .sort((left, right) => left.team.localeCompare(right.team))
})

const differentWinnerCount = computed(() => winnerCounts.value.length)

const mostSuccessfulTeams = computed(() => {
  const mostWins = Math.max(0, ...winnerCounts.value.map((winner) => winner.count))
  if (!mostWins) return []

  return winnerCounts.value
    .filter((winner) => winner.count === mostWins)
    .map((winner) => winner.team)
})

const mostSuccessfulTeamsLabel = computed(() =>
  mostSuccessfulTeams.value.length ? mostSuccessfulTeams.value.join(', ') : 'No winners recorded',
)

const teamScoreTotals = computed<TeamScoreTotal[]>(() => {
  const totals = new Map<string, { points: number; played: number }>()

  for (const row of allSeasonRows.value) {
    const snapshot = latestSnapshot(row.competition)
    if (!snapshot) continue

    for (const table of snapshot.tables) {
      for (const tableRow of table.rows) {
        const team = teamLabel(tableRow.team)
        const played = numberValue(tableRow.played)
        if (!team || played <= 0) continue

        const current = totals.get(team) ?? { points: 0, played: 0 }
        current.points += numberValue(tableRow.matchPointsFor)
        current.played += played
        totals.set(team, current)
      }
    }
  }

  return [...totals.entries()]
    .map(([team, total]) => ({
      team,
      points: total.points,
      played: total.played,
      average: total.points / total.played,
    }))
    .sort((left, right) => left.team.localeCompare(right.team))
})

const highestAverageScoreTeams = computed(() => {
  const highestAverage = Math.max(0, ...teamScoreTotals.value.map((team) => team.average))
  if (!highestAverage) return []

  return teamScoreTotals.value.filter((team) => team.average === highestAverage)
})

const highestAverageScoreLabel = computed(() => {
  if (!highestAverageScoreTeams.value.length) return 'No team scores recorded'

  const teamNames = highestAverageScoreTeams.value.map((team) => team.team).join(', ')
  return `${teamNames} (${averageValue(highestAverageScoreTeams.value[0].average)})`
})

const averageScoresData = computed<ChartData<'line', number[], string>>(() => ({
  labels: allSeasonRows.value.map((row) => row.seasonLabel),
  datasets: [
    {
      label: 'Average score',
      data: allSeasonRows.value.map((row) => averageValue(row.competition.averageScore)),
      borderColor: '#1565c0',
      backgroundColor: 'rgba(21, 101, 192, 0.12)',
      tension: 0.25,
    },
    {
      label: 'Average winning score',
      data: allSeasonRows.value.map((row) => averageValue(row.competition.averageWinningScore)),
      borderColor: '#2e7d32',
      backgroundColor: 'rgba(46, 125, 50, 0.12)',
      tension: 0.25,
    },
    {
      label: 'Average losing score',
      data: allSeasonRows.value.map((row) => averageValue(row.competition.averageLosingScore)),
      borderColor: '#c62828',
      backgroundColor: 'rgba(198, 40, 40, 0.12)',
      tension: 0.25,
    },
  ],
}))

const averageScoresOptions: ChartOptions<'line'> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom',
      labels: {
        boxWidth: 14,
        boxHeight: 14,
      },
    },
  },
  scales: {
    y: {
      beginAtZero: false,
      ticks: {
        precision: 0,
      },
    },
  },
}
</script>

<style scoped>
.analytics-all-seasons {
  background-color: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 24px;
}

.analytics-all-seasons-header {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-start;
  margin-bottom: 24px;
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

.analytics-metric-value-wrap {
  overflow-wrap: anywhere;
}

.analytics-chart-panel {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  margin-bottom: 24px;
  padding: 16px;
}

.analytics-panel-title {
  color: #1e293b;
  font-size: 1rem;
  font-weight: 700;
  margin-bottom: 12px;
}

.analytics-chart-container {
  height: 320px;
  min-height: 320px;
}

@media (max-width: 700px) {
  .analytics-all-seasons {
    padding: 16px;
  }

  .analytics-all-seasons-header {
    display: block;
  }
}
</style>
