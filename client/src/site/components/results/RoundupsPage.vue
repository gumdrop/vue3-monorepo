<template>
  <v-container fluid :class="gridSize" class="pa-0">
    <div v-if="competitionRoundups && competitionRoundups.length" class="competition-roundups-container px-4 pt-4">
      <v-row>
        <v-col v-for="roundup in competitionRoundups" :key="roundup.competition.path" cols="12">
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
    </div>

    <div v-if="roundups && roundups.length" class="roundups-container px-4">
      <v-card v-for="roundup in roundups" :key="roundup.fixtureSet.id" class="mb-4">
        <v-card-title>
          {{ date(roundup.fixtureSet.date, 'd MMMM yyyy') }}: {{ roundup.fixtureSet.description }}
        </v-card-title>
        <v-card-text>
          <QlMarkdown :text="roundup.text" />
        </v-card-text>
      </v-card>
    </div>
    <div v-else-if="!competitionRoundups || !competitionRoundups.length" class="pa-4">
      No roundups are available for this season.
    </div>
  </v-container>
</template>

<script setup lang="ts">
import FixturesDAO from '@/dao/FixturesDAO'
import TextDAO from '@/dao/TextDAO'
import { useCompetitions } from '@/services/CompetitionService'
import { useDateTime } from '@/services/DateService'
import { useFixtures } from '@/services/FixturesService'
import { useLayout } from '@/services/LayoutService'
import { useResultsStore } from '@/stores/results'
import { usePromise } from '@/utils/PromiseRef'
import QlMarkdown from '../text/QlMarkdown.vue'

const { date } = useDateTime()
const { spentFixtures } = useFixtures()
const { gridSize } = useLayout()
const { seasonId } = useResultsStore()
const { roundups: fetchCompetitionRoundups } = useCompetitions()

const competitionRoundups = usePromise(() => fetchCompetitionRoundups(`${seasonId?.value}`))

const roundups = usePromise(async () => {
  const fixtureRefs = await spentFixtures(`${seasonId?.value}`)
  const fixtureSets = await FixturesDAO.entityList(fixtureRefs)

  const summaries = []
  for (const fixtureSet of fixtureSets ?? []) {
    if (!fixtureSet.resultsSummary) continue

    const summaryText = await TextDAO.getData(fixtureSet.resultsSummary)
    if (summaryText?.text?.trim()) {
      summaries.push({ fixtureSet, text: summaryText.text })
    }
  }

  return summaries.sort((a, b) => b.fixtureSet.date.localeCompare(a.fixtureSet.date))
})
</script>

<style scoped>
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
