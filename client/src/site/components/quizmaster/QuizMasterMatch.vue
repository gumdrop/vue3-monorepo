<template>
  <div class="quiz-match-wrap mt-4">
  <v-card>
    <v-card-title class="d-flex justify-space-between align-center" style="padding-right: 100px;">
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
          <v-expansion-panels v-if="isIndividualRound(round)" class="mb-3">
            <v-expansion-panel>
              <v-expansion-panel-title>View assignments &amp; jokers</v-expansion-panel-title>
              <v-expansion-panel-text>
                <v-table v-if="round.subjects" density="compact">
                  <thead>
                    <tr>
                      <th>Category</th>
                      <th>{{ homeName }} contestant</th>
                      <th>{{ awayName }} contestant</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="subjectName in round.subjects" :key="subjectName">
                      <td>{{ subjectName }}</td>
                      <td>
                        {{ store.categoryAssignments[roundIndex]?.home[subjectName] ?? '—' }}
                        <v-chip
                          v-if="store.jokers[roundIndex]?.home === subjectName"
                          size="x-small"
                          color="warning"
                          class="ml-1"
                        >
                          Joker
                        </v-chip>
                      </td>
                      <td>
                        {{ store.categoryAssignments[roundIndex]?.away[subjectName] ?? '—' }}
                        <v-chip
                          v-if="store.jokers[roundIndex]?.away === subjectName"
                          size="x-small"
                          color="warning"
                          class="ml-1"
                        >
                          Joker
                        </v-chip>
                      </td>
                    </tr>
                  </tbody>
                </v-table>
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>

          <div class="text-subtitle-1 text-medium-emphasis mb-2">
            {{ round.round }}
            <span v-if="subject"> · {{ subject }}</span>
          </div>

          <v-alert v-if="spare" type="warning" density="compact" class="mb-2">
            Original question replaced with spare (printed answer disputed).
          </v-alert>

          <p class="question-text mb-1">
            <strong>{{ question.number }}.</strong> <span v-html="questionHtml" />
          </p>
          <p class="text-subtitle-1">
            For
            <strong v-if="subject">{{ contestantName }}</strong>
            <strong v-else>{{ targetName }}</strong>
            <span v-if="subject"> ({{ targetName }})</span>
          </p>

          <v-alert v-if="showAnswer" type="info" density="compact" class="mt-2">
            <strong>Answer:</strong> <span class="answer-text" v-html="answerHtml" />
          </v-alert>
          <v-alert v-else type="info" density="compact" class="mt-2" variant="tonal">
            <em>Answer hidden — press the timer to reveal.</em>
          </v-alert>

          <div class="d-flex flex-wrap ga-2 mt-4">
            <template v-if="!passedOver">
              <v-btn
                color="success"
                :disabled="outcomeButtonsDisabled"
                @click="record('correct')"
              >
                Correct (+{{ jokerPoints(2) }})
              </v-btn>
              <v-btn
                color="warning"
                :disabled="outcomeButtonsDisabled"
                @click="passOver"
              >
                Pass Over
              </v-btn>
              <v-btn
                v-if="!spare"
                variant="tonal"
                :disabled="outcomeButtonsDisabled"
                @click="invokeSpare"
              >
                Invoke spare question
              </v-btn>
            </template>
            <template v-else>
              <v-btn
                color="success"
                :disabled="outcomeButtonsDisabled"
                @click="record('bonus')"
              >
                Correct (+{{ jokerPoints(1) }})
              </v-btn>
              <v-btn
                color="error"
                :disabled="outcomeButtonsDisabled"
                @click="record('unanswered')"
              >
                Incorrect
              </v-btn>
            </template>
          </div>

          <div class="d-flex flex-wrap ga-2 mt-4">
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
        <div v-if="store.sparesRound" class="mb-4">
          <div class="text-subtitle-1 mb-2">{{ store.sparesRound.round }}</div>
          <v-expansion-panels>
            <v-expansion-panel>
              <v-expansion-panel-title>View spare questions</v-expansion-panel-title>
              <v-expansion-panel-text>
                <v-list density="compact">
                  <v-list-item v-for="(q, i) in store.sparesRound.questions" :key="i">
                    <v-list-item-title>{{ q.number }}. {{ q.question }}</v-list-item-title>
                    <v-list-item-subtitle>
                      Answer: <span v-html="underlineHtml(q.answer)" />
                    </v-list-item-subtitle>
                  </v-list-item>
                </v-list>
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>
        </div>

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

        <div v-if="store.tiebreakRound" class="mt-4">
          <div class="text-subtitle-1 mb-2">{{ store.tiebreakRound.round }}</div>
          <v-expansion-panels>
            <v-expansion-panel>
              <v-expansion-panel-title>View tie-breaker</v-expansion-panel-title>
              <v-expansion-panel-text>
                <v-list density="compact">
                  <v-list-item v-for="(q, i) in store.tiebreakRound.questions" :key="i">
                    <v-list-item-title>{{ q.question }}</v-list-item-title>
                    <v-list-item-subtitle>
                      Answer: <span v-html="underlineHtml(q.answer)" />
                    </v-list-item-subtitle>
                  </v-list-item>
                </v-list>
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>
        </div>

        <div class="d-flex justify-space-between mt-2">
          <v-btn variant="text" @click="phase = 'rounds'">Back to match</v-btn>
          <v-btn color="primary" @click="finishBeer">Finish match</v-btn>
        </div>
      </template>
    </v-card-text>
  </v-card>

  <v-btn
    v-if="showTimer"
    class="timer-fab"
    :class="{ 'timer-done': timerState === 'done' }"
    :color="timerColor"
    @click="toggleTimer"
  >
    <span class="timer-fab-content">
      <span class="timer-fab-number">{{ timerLabel }}</span>
      <span class="timer-fab-caption">{{ timerCaption }}</span>
    </span>
  </v-btn>
  </div>
</template>
<script setup lang="ts">
import { computed, onUnmounted, ref } from 'vue'
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

const targetSide = computed(() =>
  passedOver.value ? (owner.value === 'home' ? 'away' : 'home') : owner.value,
)

const contestantName = computed(() => {
  if (!subject.value || !question.value) return ''
  return store.contestantFor(roundIndex.value, question.value, targetSide.value) ?? '—'
})

const targetName = computed(() => (targetSide.value === 'home' ? homeName.value : awayName.value))

const displayQuestion = computed(() => spare.value?.question ?? question.value?.question ?? '')
const displayAnswer = computed(() => spare.value?.answer ?? question.value?.answer ?? '')
const questionHtml = computed(() => underlineHtml(displayQuestion.value))
const answerHtml = computed(() => underlineHtml(displayAnswer.value))

type TimerState = 'idle' | 'running' | 'paused' | 'done'

const timerState = ref<TimerState>('idle')
const passedOver = ref(false)
const answerRevealed = ref(false)
const remaining = ref(30)
let timerHandle: ReturnType<typeof setInterval> | undefined

const timerDuration = computed(() => (passedOver.value ? 15 : 30))
const showAnswer = computed(() => answerRevealed.value)
const timerLabel = computed(() =>
  timerState.value === 'idle' ? timerDuration.value : remaining.value,
)
const timerCaption = computed(() => {
  if (timerState.value === 'idle') return 'Start'
  if (timerState.value === 'paused') return 'Paused'
  if (timerState.value === 'done') return 'Time'
  return 'sec'
})
const timerColor = computed(() => {
  if (timerState.value === 'done') return 'error'
  if (timerState.value === 'paused') return 'warning'
  return 'green-darken-4'
})
const showTimer = computed(
  () => phase.value === 'rounds' && !settingUpIndividual.value && Boolean(round.value && question.value),
)

const timerStarted = computed(() => timerState.value !== 'idle')
const outcomeButtonsDisabled = computed(() => Boolean(outcome.value) || !timerStarted.value)

function clearTimer() {
  if (timerHandle !== undefined) {
    clearInterval(timerHandle)
    timerHandle = undefined
  }
}

function tick() {
  if (remaining.value <= 1) {
    remaining.value = 0
    clearTimer()
    timerState.value = 'done'
  } else {
    remaining.value -= 1
  }
}

function startTimer() {
  clearTimer()
  answerRevealed.value = true
  remaining.value = timerDuration.value
  timerState.value = 'running'
  timerHandle = setInterval(tick, 1000)
}

function pauseTimer() {
  clearTimer()
  timerState.value = 'paused'
}

function resumeTimer() {
  timerState.value = 'running'
  timerHandle = setInterval(tick, 1000)
}

function resetTimer() {
  clearTimer()
  timerState.value = 'idle'
  remaining.value = timerDuration.value
}

function toggleTimer() {
  if (timerState.value === 'idle') startTimer()
  else if (timerState.value === 'running') pauseTimer()
  else if (timerState.value === 'paused') resumeTimer()
  else resetTimer()
}

onUnmounted(clearTimer)

function jokerPoints(base: number): number {
  if (!subject.value || !question.value) return base
  const jokerCategory =
    owner.value === 'home' ? store.jokers[roundIndex.value]?.home : store.jokers[roundIndex.value]?.away
  return jokerCategory === subject.value ? base * 2 : base
}

function record(outcome: QuizQuestionOutcome) {
  store.recordOutcome(roundIndex.value, questionIndex.value, outcome)
  haltTimer()
}

function passOver() {
  passedOver.value = true
  resetTimer()
}

function haltTimer() {
  if (timerState.value === 'running') {
    clearTimer()
    timerState.value = 'paused'
  }
}

function resetQuestionState() {
  answerRevealed.value = false
  passedOver.value = false
  resetTimer()
}

function undo() {
  store.undo()
  resetQuestionState()
}

function invokeSpare() {
  if (!store.invokeSpare(roundIndex.value, questionIndex.value)) return
  // A spare is a fresh question: hide the previous answer and restart the timer.
  answerRevealed.value = false
  resetTimer()
}

function next() {
  resetQuestionState()

  const currentRound = round.value
  if (currentRound && questionIndex.value < currentRound.questions.length - 1) {
    questionIndex.value += 1
  } else if (roundIndex.value < store.scoredRounds.length - 1) {
    roundIndex.value += 1
    questionIndex.value = 0
    settingUpIndividual.value = isIndividualRound(store.scoredRounds[roundIndex.value])
  } else {
    phase.value = 'beer'
  }
}

function finishBeer() {
  store.recordBeerRound(beerHome.value, beerAway.value)
  emit('done')
}
</script>
<style scoped>
.timer-fab {
  position: absolute;
  top: 0;
  right: 16px;
  width: 76px !important;
  height: 76px !important;
  min-width: 76px !important;
  min-height: 76px !important;
  padding: 0 !important;
  border-radius: 50% !important;
  z-index: 20;
}

.quiz-match-wrap {
  position: relative;
}

.question-text {
  font-size: 1.6rem;
  line-height: 1.35;
}

.answer-text {
  font-size: 1.4rem;
}

.timer-fab-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  line-height: 1;
}

.timer-fab-number {
  font-size: 1.7rem;
  font-weight: 700;
}

.timer-fab-caption {
  font-size: 0.65rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  opacity: 0.85;
}

@keyframes timer-flash {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.35;
  }
}

.timer-done {
  animation: timer-flash 0.6s ease-in-out infinite;
}
</style>
