<template>
  <v-container fluid :class="gridSize" class="pa-0">
    <div v-if="roundups && roundups.length" class="roundups-container">
      <v-card v-for="roundup in roundups" :key="roundup.fixtureSet.id" class="mb-4">
        <v-card-title>
          {{ date(roundup.fixtureSet.date, 'd MMMM yyyy') }}: {{ roundup.fixtureSet.description }}
        </v-card-title>
        <v-card-text>
          <QlMarkdown :text="roundup.text" />
        </v-card-text>
      </v-card>
    </div>
    <div v-else class="pa-4">No roundups are available for this season.</div>
  </v-container>
</template>

<script setup lang="ts">
import FixturesDAO from '@/dao/FixturesDAO'
import TextDAO from '@/dao/TextDAO'
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
