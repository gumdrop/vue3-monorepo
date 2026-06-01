<template>
  <v-container v-if="questions" fluid>
    <v-list v-if="questions.length > 0" class="questions-list">
      <v-list-item
        v-for="question in questions"
        :key="question.path"
        :href="question.questionsUrl"
        target="_blank"
        rel="noopener noreferrer"
        prepend-icon="mdi-file-question"
        :title="questionLinkText(question)"
      />
    </v-list>
    <v-sheet v-else class="pa-4 text-medium-emphasis">No question papers are available for this season.</v-sheet>
  </v-container>
</template>
<script setup lang="ts">
import type Fixtures from '@/entity/Fixtures'
import { useDateTime } from '@/services/DateService'
import { useFixtures } from '@/services/FixturesService'
import { useResultsStore } from '@/stores/results'
import { usePromise } from '@/utils/PromiseRef'

const { date } = useDateTime()
const { questionPapers } = useFixtures()
const { seasonId } = useResultsStore()

const questions = usePromise(() => questionPapers(`${seasonId?.value}`))

const questionLinkText = (fixtures: Fixtures) => {
  const fixtureDate = date(fixtures.date, 'd MMMM yyyy') ?? fixtures.date
  return fixtures.description ? `${fixtureDate} : ${fixtures.description}` : fixtureDate
}
</script>
<style scoped>
.questions-list {
  background: transparent;
}
</style>
