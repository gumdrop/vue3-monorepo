<template>
  <v-container :class="gridSize" fluid>
    <v-col>
      <v-card v-if="statistics">
        <v-card-text>
          <v-table class="roll-of-honour">
            <thead>
              <tr>
                <th>Season</th>
                <th>Winner</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(result, index) in sortedResults" :key="resultKey(result, index)">
                <td>
                  <CompetitionStatisticsResultSeason :result="result" />
                </td>
                <td>
                  <CompetitionStatisticsResultTeam :result="result" />
                </td>
              </tr>
            </tbody>
          </v-table>
        </v-card-text>
      </v-card>
    </v-col>
  </v-container>
</template>

<script setup lang="ts">
import type { CompetitionStatisticsResult } from '@/entity/CompetitionStatistics'
import { useLayout } from '@/services/LayoutService'
import { computed, toRef } from 'vue'
import CompetitionStatisticsResultSeason from './CompetitionStatisticsResultSeason.vue'
import CompetitionStatisticsResultTeam from './CompetitionStatisticsResultTeam.vue'
import { referenceId } from './competitionStatisticsRefs'
import { useCompetitionStatisticsEntry } from './useCompetitionStatisticsEntry'

const props = defineProps<{
  id: string
}>()

const { gridSize } = useLayout()

const { statistics } = useCompetitionStatisticsEntry(toRef(props, 'id'))

const sortedResults = computed(() =>
  [...(statistics.value?.results ?? [])].sort((left, right) =>
    left.seasonText.localeCompare(right.seasonText),
  ),
)

const resultKey = (result: CompetitionStatisticsResult, index: number) =>
  `${result.seasonText}-${referenceId(result.team) || result.teamText}-${index}`
</script>
