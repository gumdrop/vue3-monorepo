<template>
  <v-sheet v-if="latestSummary" class="latest-results-summary pa-4" elevation="0">
    <div class="summary-header mb-2">
      <v-icon color="primary" size="20" class="mr-2">mdi-auto-awesome</v-icon>
      <div>
        <div class="text-subtitle-1 font-weight-bold">Latest Results Summary</div>
        <div class="text-caption text-medium-emphasis">
          {{ date(latestSummary.fixtureSet.date, 'd MMMM yyyy') }}:
          {{ latestSummary.fixtureSet.description }}
        </div>
      </div>
    </div>
    <QlMarkdown :text="latestSummary.text" />
  </v-sheet>
</template>

<script setup lang="ts">
import FixturesDAO from '@/dao/FixturesDAO'
import TextDAO from '@/dao/TextDAO'
import { useDateTime } from '@/services/DateService'
import { useFixtures } from '@/services/FixturesService'
import { usePromise } from '@/utils/PromiseRef'
import QlMarkdown from '../text/QlMarkdown.vue'

const props = defineProps<{ seasonId: string }>()

const { date } = useDateTime()
const { spentFixtures } = useFixtures()

const latestSummary = usePromise(async () => {
  const fixtureRefs = await spentFixtures(props.seasonId)
  const fixtureSets = await FixturesDAO.entityList(fixtureRefs)

  for (const fixtureSet of fixtureSets ?? []) {
    if (!fixtureSet.resultsSummary) continue

    const summaryText = await TextDAO.getData(fixtureSet.resultsSummary)
    if (summaryText?.text?.trim()) {
      return { fixtureSet, text: summaryText.text }
    }
  }

  return undefined
})
</script>

<style scoped>
.latest-results-summary {
  background-color: white;
  border-radius: 12px;
}

.summary-header {
  display: flex;
  align-items: flex-start;
}
</style>
