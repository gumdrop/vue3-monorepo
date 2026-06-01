<template>
  <v-container v-if="questions" fluid>
    <v-list v-if="questions.length > 0" class="questions-list">
      <v-list-item
        v-for="question in questions"
        :key="question.fixtures.path"
        :href="question.fixtures.questionsUrl"
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
import { useDateTime } from '@/services/DateService'
import { useFixtures } from '@/services/FixturesService'
import type { QuestionPaper } from '@/services/FixturesService'
import { useResultsStore } from '@/stores/results'
import { usePromise } from '@/utils/PromiseRef'

const { date } = useDateTime()
const { questionPapers } = useFixtures()
const { seasonId } = useResultsStore()

const questions = usePromise(() => questionPapers(`${seasonId?.value}`))

const questionLinkText = ({ fixtures, competition }: QuestionPaper) => {
  const fixtureDate = date(fixtures.date, 'd MMMM yyyy') ?? fixtures.date
  return fixtures.description
    ? `${fixtureDate} : ${competition.name} : ${fixtures.description}`
    : `${fixtureDate} : ${competition.name}`
}
</script>
<style scoped>
.questions-list {
  background: transparent;
}
</style>
