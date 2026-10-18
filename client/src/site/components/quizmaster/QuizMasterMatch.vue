<template>
  <v-card class="mt-4">
    <v-card-title class="d-flex justify-space-between align-center">
      <span>Match</span>
      <span class="text-h5">
        {{ homeName }} {{ store.score.home }} — {{ store.score.away }} {{ awayName }}
      </span>
    </v-card-title>

    <v-card-text>
      <template v-if="phase === 'rounds'">
        <IndividualRoundSetup
          v-if="settingUpIndividual && round"
          :round-index="roundIndex"
          :round="round"
          @saved="settingUpIndividual = false"
        />

        <template v-else-if="round && question">
          <div class="text-subtitle-1 text-medium-emphasis mb-2">
            {{ round.round }}
            <span v-if="subject"> · {{ subject }}</span>
          </div>

          <v-alert v-if="spare" type="warning" density="compact" class="mb-2">
            Original question replaced with spare (printed answer disputed).
          </v-alert>

          <p class="text-h6 mb-1">
            <strong>{{ question.number }}.</strong> <span v-html="questionHtml" />
          </p>
          <p class="text-subtitle-1">
            For
            <strong v-if="subject">{{ contestantName }}</strong>
            <strong v-else>{{ ownerName }}</strong>
            <span v-if="subject"> ({{ ownerName }})</span>
          </p>

          <v-alert type="info" density="compact" class="mt-2">
            <strong>Answer:</strong> <span v-html="answerHtml" />
          </v-alert>

          <div class="d-flex flex-wrap ga-2 mt-4">
            <v-btn
              color="success"
              :disabled="Boolean(outcome)"
              @click="record('correct')"
            >
              Correct (+{{ jokerPoints(2) }})
            </v-btn>
            <v-btn
              color="warning"
              :disabled="Boolean(outcome)"
              @click="record('bonus')"
            >
              Bonus to opposition (+{{ jokerPoints(1) }})
            </v-btn>
            <v-btn
              color="grey"
              :disabled="Boolean(outcome)"
              @click="record('unanswered')"
            >
              Unanswered
            </v-btn>
          </div>

          <div class="d-flex flex-wrap ga-2 mt-4">
            <v-btn v-if="outcome && !spare" variant="tonal" @click="invokeSpare">
              Invoke spare
            </v-btn>
            <v-btn v-if="outcome" variant="text" @click="undo">Undo</v-btn>
            <v-spacer />
            <v-btn v-if="outcome" color="primary" @click="next">Next</v-btn>
          </div>
        </template>

        <v-alert v-else type="success" class="mt-4">
          All scored rounds complete. Continue to the beer round.
          <template #append>
            <v-btn color="primary" @click="phase = 'beer'">Beer round</v-btn>
          </template>
        </v-alert>
      </template>

      <template v-else>
        <div class="text-subtitle-1 mb-2">
          {{ store.beerRound?.round ?? 'Beer round' }} — {{ store.beerRound?.questions.length ?? 0 }} questions
        </div>

        <v-expansion-panels>
          <v-expansion-panel>
            <v-expansion-panel-title>View beer round questions</v-expansion-panel-title>
            <v-expansion-panel-text>
              <v-list density="compact">
                <v-list-item v-for="(q, i) in store.beerRound?.questions ?? []" :key="i">
                  <v-list-item-title>{{ q.number }}. {{ q.question }}</v-list-item-title>
                  <v-list-item-subtitle>
                    Answer: <span v-html="underlineHtml(q.answer)" />
                  </v-list-item-subtitle>
                </v-list-item>
              </v-list>
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>

        <v-row class="mt-4">
          <v-col cols="6">
            <v-text-field
              v-model.number="beerHome"
              type="number"
              min="0"
              :label="`${homeName} beer round score`"
            />
          </v-col>
          <v-col cols="6">
            <v-text-field
              v-model.number="beerAway"
              type="number"
              min="0"
              :label="`${awayName} beer round score`"
            />
          </v-col>
        </v-row>

        <div class="d-flex justify-space-between mt-2">
          <v-btn variant="text" @click="phase = 'rounds'">Back to match</v-btn>
          <v-btn color="primary" @click="finishBeer">Finish match</v-btn>
        </div>
      </template>
    </v-card-text>
  </v-card>
</template>
<script setup lang="ts">
import { computed, ref } from 'vue'
import type { QuizQuestionOutcome } from '@quizleague/shared'
import { isIndividualRound } from '@/services/QuizScoring'
import { useQuizmasterStore } from '@/stores/quizmaster'
import { underlineHtml } from '@/utils/underlines'
import IndividualRoundSetup from './IndividualRoundSetup.vue'

const emit = defineEmits<{ back: []; done: [] }>()

const store = useQuizmasterStore()

const phase = ref<'rounds' | 'beer'>('rounds')
const roundIndex = ref(0)
const questionIndex = ref(0)
const settingUpIndividual = ref(false)
const beerHome = ref(0)
const beerAway = ref(0)

const homeName = computed(() => store.fixture?.homeName ?? 'Home')
const awayName = computed(() => store.fixture?.awayName ?? 'Away')

const round = computed(() => store.scoredRounds[roundIndex.value])
const question = computed(() => round.value?.questions[questionIndex.value])
const key = computed(() => store.questionKey(roundIndex.value, questionIndex.value))
const outcome = computed(() => (key.value ? store.outcomes[key.value] : undefined))
const spare = computed(() => (key.value ? store.spares[key.value] : undefined))

const owner = computed(() =>
  question.value ? store.ownerFor(roundIndex.value, question.value) : 'home',
)
const subject = computed(() =>
  question.value ? store.subjectFor(roundIndex.value, question.value) : undefined,
)

const contestantName = computed(() => {
  if (!subject.value || !question.value) return ''
  return store.contestantFor(roundIndex.value, question.value, owner.value) ?? '—'
})

const ownerName = computed(() => (owner.value === 'home' ? homeName.value : awayName.value))

const displayQuestion = computed(() => spare.value?.question ?? question.value?.question ?? '')
const displayAnswer = computed(() => spare.value?.answer ?? question.value?.answer ?? '')
const questionHtml = computed(() => underlineHtml(displayQuestion.value))
const answerHtml = computed(() => underlineHtml(displayAnswer.value))

function jokerPoints(base: number): number {
  if (!subject.value || !question.value) return base
  const jokerCategory =
    owner.value === 'home' ? store.jokers[roundIndex.value]?.home : store.jokers[roundIndex.value]?.away
  return jokerCategory === subject.value ? base * 2 : base
}

function record(outcome: QuizQuestionOutcome) {
  store.recordOutcome(roundIndex.value, questionIndex.value, outcome)
}

function undo() {
  store.undo()
}

function invokeSpare() {
  store.invokeSpare(roundIndex.value, questionIndex.value)
}

function next() {
  const currentRound = round.value
  if (currentRound && questionIndex.value < currentRound.questions.length - 1) {
    questionIndex.value += 1
  } else if (roundIndex.value < store.scoredRounds.length - 1) {
    roundIndex.value += 1
    questionIndex.value = 0
    settingUpIndividual.value = isIndividualRound(store.scoredRounds[roundIndex.value])
  } else {
    phase.value = 'beer'
    return
  }
}

function finishBeer() {
  store.recordBeerRound(beerHome.value, beerAway.value)
  emit('done')
}
</script>
