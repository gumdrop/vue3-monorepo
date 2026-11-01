<template>
  <div class="quiz-match-wrap mt-4">
  <v-card>
    <v-card-title class="match-header-title d-flex justify-space-between align-center">
      <div class="d-flex align-center ga-2">
        <span>Match</span>
        <v-btn size="small" variant="tonal" @click="scoresheetOpen = true">Scoresheet</v-btn>
      </div>
      <span class="match-score score-line">
        <ResponsiveTeamName v-if="homeTeam" :team="homeTeam" />
        <template v-else>{{ homeName }}</template>
        {{ store.score.home }} — {{ store.score.away }}
        <ResponsiveTeamName v-if="awayTeam" :team="awayTeam" />
        <template v-else>{{ awayName }}</template>
      </span>
    </v-card-title>

    <v-card-text>
      <template v-if="phase === 'rounds'">
        <IndividualRoundSetup
          v-if="settingUpIndividual && round"
          :round-index="roundIndex"
          :round="round"
          @saved="onRoundSetupSaved"
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
            <template v-if="!effectivePassedOver">
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
                Pass Across
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
            <v-btn color="primary" :disabled="!canGoBack" @click="back">Back</v-btn>
          </div>
        </template>

        <v-alert v-else type="success" class="mt-4">
          <template v-if="store.shouldPlayTieBreak">
            The match is tied after 10 rounds — play the cup tie-break.
          </template>
          <template v-else>
            All scored rounds complete. Continue to the beer round.
          </template>
          <template #append>
            <v-btn v-if="store.shouldPlayTieBreak" color="primary" @click="goToTieBreak">
              Cup tie-break
            </v-btn>
            <v-btn v-else color="primary" @click="goToBeer">Beer round</v-btn>
          </template>
        </v-alert>
      </template>

      <template v-else-if="phase === 'tiebreak'">
        <v-alert type="warning" density="compact" class="mb-4">
          Cup match tied after 10 rounds — play to a win.
        </v-alert>

        <template v-if="currentTieBreakSection">
          <v-alert v-if="store.tieBreakWinner" type="success" class="mb-4">
            <strong>{{ tieBreakWinnerName }}</strong> win via {{ store.tieBreakMethod }}.
          </v-alert>
          <div class="text-subtitle-1 mb-2">
            Section {{ store.tieBreakSectionIndex + 1 }} of {{ store.tieBreakSections.length }}:
            {{ currentTieBreakSection.name }}
          </div>

          <v-table density="compact">
            <thead>
              <tr>
                <th>Question</th>
                <th>{{ homeName }} correct</th>
                <th>{{ awayName }} correct</th>
                <th>Answer</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(tieQuestion, tieQuestionIndex) in currentTieBreakSection.questions" :key="tieQuestionIndex">
                <td>
                  <strong>{{ tieQuestion.number }}.</strong> {{ tieQuestion.question }}
                </td>
                <td>
                  <v-checkbox
                    :model-value="tieBreakMark(tieQuestionIndex)?.home === true"
                    hide-details
                    density="compact"
                    @update:model-value="setTieBreakMark(tieQuestionIndex, 'home', $event)"
                  />
                </td>
                <td>
                  <v-checkbox
                    :model-value="tieBreakMark(tieQuestionIndex)?.away === true"
                    hide-details
                    density="compact"
                    @update:model-value="setTieBreakMark(tieQuestionIndex, 'away', $event)"
                  />
                </td>
                <td><span v-html="underlineHtml(tieQuestion.answer)" /></td>
              </tr>
            </tbody>
          </v-table>

          <div class="d-flex align-center justify-space-between mt-4">
            <div class="text-subtitle-1">
              Section score: {{ homeName }} {{ currentTieBreakTotals.home }} —
              {{ currentTieBreakTotals.away }} {{ awayName }}
            </div>
            <v-btn
              v-if="currentTieBreakComplete && !store.tieBreakWinner"
              color="primary"
              @click="store.advanceTieBreakSection"
            >
              Section tied — continue
            </v-btn>
          </div>

          <div v-if="store.tieBreakWinner" class="d-flex justify-space-between mt-4">
            <div class="text-subtitle-1">
              Submitted score: {{ homeName }} {{ store.submissionScore.home }} —
              {{ store.submissionScore.away }} {{ awayName }}
            </div>
            <v-btn color="primary" @click="finishTieBreak">Finish match</v-btn>
          </div>
          <div v-else class="d-flex justify-space-between mt-2">
            <v-btn variant="text" @click="goToRounds">Back to match</v-btn>
          </div>
        </template>

        <template v-else>
          <v-alert v-if="store.tieBreakWinner" type="success" class="mb-4">
            <strong>{{ tieBreakWinnerName }}</strong> win via {{ store.tieBreakMethod }}.
          </v-alert>
          <v-alert type="info" density="compact" class="mb-4">
            All tie-break sections are level. Use the remaining tie-break criteria.
          </v-alert>

          <div class="mb-4">
            <div class="text-subtitle-2">
              Own original questions answered correctly:
              {{ homeName }} {{ store.ownQuestionCorrect.home }} —
              {{ store.ownQuestionCorrect.away }} {{ awayName }}
            </div>
            <div class="text-subtitle-2">
              Bonus questions answered correctly:
              {{ homeName }} {{ store.bonusQuestionCorrect.home }} —
              {{ store.bonusQuestionCorrect.away }} {{ awayName }}
            </div>
          </div>

          <v-card variant="tonal" class="mb-4">
            <v-card-title>Coin toss</v-card-title>
            <v-card-text>
              <div class="text-subtitle-2 mb-2">
                Away team calls:
                <v-chip
                  class="ml-2"
                  :color="store.tieBreakCoinToss.awayCall === 'heads' ? 'primary' : undefined"
                  @click="store.setTieBreakCoinTossAwayCall('heads')"
                >
                  Heads
                </v-chip>
                <v-chip
                  class="ml-2"
                  :color="store.tieBreakCoinToss.awayCall === 'tails' ? 'primary' : undefined"
                  @click="store.setTieBreakCoinTossAwayCall('tails')"
                >
                  Tails
                </v-chip>
              </div>
              <div class="text-subtitle-2">
                Question master tosses:
                <v-chip
                  class="ml-2"
                  :color="store.tieBreakCoinToss.toss === 'heads' ? 'primary' : undefined"
                  @click="store.setTieBreakCoinTossResult('heads')"
                >
                  Heads
                </v-chip>
                <v-chip
                  class="ml-2"
                  :color="store.tieBreakCoinToss.toss === 'tails' ? 'primary' : undefined"
                  @click="store.setTieBreakCoinTossResult('tails')"
                >
                  Tails
                </v-chip>
              </div>
            </v-card-text>
          </v-card>

          <div class="d-flex justify-space-between mt-2">
            <v-btn variant="text" @click="goToRounds">Back to match</v-btn>
            <v-btn
              v-if="store.tieBreakWinner"
              color="primary"
              @click="finishTieBreak"
            >
              Finish match
            </v-btn>
            <v-btn v-else variant="text" @click="store.setTieBreakSectionIndex(0)">
              Review tie-break sections
            </v-btn>
          </div>
        </template>
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
          <v-btn variant="text" @click="goToRounds">Back to match</v-btn>
          <v-btn color="primary" @click="finishBeer">Finish match</v-btn>
        </div>
      </template>
    </v-card-text>
  </v-card>

  <v-dialog v-model="scoresheetOpen" max-width="960">
    <v-card>
      <v-card-title class="d-flex justify-space-between align-center">
        <span>Scoresheet</span>
        <v-btn icon variant="text" @click="scoresheetOpen = false">✕</v-btn>
      </v-card-title>
      <v-card-text>
        <div class="score-line text-h6 mb-4">
          <ResponsiveTeamName v-if="homeTeam" :team="homeTeam" />
          <template v-else>{{ homeName }}</template>
          {{ store.score.home }} — {{ store.score.away }}
          <ResponsiveTeamName v-if="awayTeam" :team="awayTeam" />
          <template v-else>{{ awayName }}</template>
        </div>

        <v-table density="compact">
          <thead>
            <tr>
              <th>No.</th>
              <th>Directed at</th>
              <th>Joker</th>
              <th>Outcome</th>
              <th>Points</th>
            </tr>
          </thead>
          <tbody>
            <template v-for="(round, roundIndex) in store.scoresheet" :key="roundIndex">
              <tr class="scoresheet-round-row">
                <td colspan="5" class="font-weight-bold">{{ round.name }}</td>
              </tr>
              <tr v-for="(entry, entryIndex) in round.entries" :key="entryIndex">
                <td>
                  {{ entry.number }}
                  <v-chip
                    v-if="entry.spareInvoked"
                    size="x-small"
                    color="warning"
                    class="ml-1"
                  >
                    Spare
                  </v-chip>
                </td>
                <td>{{ directedText(entry) }}</td>
                <td>
                  <v-chip v-if="entry.joker" size="x-small" color="warning">
                    {{ jokerText(entry) }}
                  </v-chip>
                  <template v-else>—</template>
                </td>
                <td>{{ outcomeText(entry) }}</td>
                <td>{{ pointsText(entry) }}</td>
              </tr>
              <tr class="scoresheet-total-row">
                <td colspan="5" class="text-right">
                  <div>Round: {{ homeName }} {{ round.homePoints }} — {{ round.awayPoints }} {{ awayName }}</div>
                  <div class="font-weight-bold">
                    Running total: {{ homeName }} {{ round.homeTotal }} — {{ round.awayTotal }} {{ awayName }}
                  </div>
                </td>
              </tr>
            </template>
          </tbody>
        </v-table>

        <div class="d-flex justify-end mt-4">
          <v-btn variant="text" @click="scoresheetOpen = false">Close</v-btn>
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>

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
import { useQuizmasterStore, type ScoresheetEntry } from '@/stores/quizmaster'
import { underlineHtml } from '@/utils/underlines'
import ResponsiveTeamName from '../common/ResponsiveTeamName.vue'
import IndividualRoundSetup from './IndividualRoundSetup.vue'

const emit = defineEmits<{ back: []; done: [] }>()

const store = useQuizmasterStore()

const clampRoundIndex = (index: number) =>
  Math.max(0, Math.min(index, Math.max(0, store.scoredRounds.length - 1)))
const clampQuestionIndex = (roundIdx: number, index: number) =>
  Math.max(0, Math.min(index, Math.max(0, (store.scoredRounds[roundIdx]?.questions.length ?? 1) - 1)))

const initialRoundIndex = clampRoundIndex(store.matchPosition.roundIndex)
const initialRound = store.scoredRounds[initialRoundIndex]
const phase = ref<'rounds' | 'tiebreak' | 'beer'>(store.matchPosition.phase)
const roundIndex = ref(initialRoundIndex)
const questionIndex = ref(clampQuestionIndex(initialRoundIndex, store.matchPosition.questionIndex))
const settingUpIndividual = ref(
  Boolean(
    initialRound &&
      isIndividualRound(initialRound) &&
      !store.categoryAssignments[initialRoundIndex],
  ),
)
const beerHome = ref(0)
const beerAway = ref(0)

const homeName = computed(() => store.fixture?.homeName ?? 'Home')
const awayName = computed(() => store.fixture?.awayName ?? 'Away')
const homeTeam = computed(() => store.fixture?.homeTeam)
const awayTeam = computed(() => store.fixture?.awayTeam)

const scoresheetOpen = ref(false)

function directedText(entry: ScoresheetEntry): string {
  if (entry.category) {
    return `${entry.category} · ${entry.contestant ?? '—'}`
  }
  return entry.owner === 'home' ? homeName.value : awayName.value
}

function outcomeText(entry: ScoresheetEntry): string {
  if (!entry.outcome) return '—'
  if (entry.outcome === 'correct') return 'Correct'
  if (entry.outcome === 'bonus') return 'Bonus'
  return 'Unanswered'
}

function pointsText(entry: ScoresheetEntry): string {
  if (!entry.outcome) return '—'
  if (entry.points === 0) return '0'
  const side = entry.scoringSide === 'home' ? homeName.value : awayName.value
  return `+${entry.points} ${side}`
}

function jokerText(entry: ScoresheetEntry): string {
  if (entry.joker === 'both') return `Joker (${homeName.value} & ${awayName.value})`
  if (entry.joker === 'home') return `Joker (${homeName.value})`
  if (entry.joker === 'away') return `Joker (${awayName.value})`
  return ''
}

const currentTieBreakSection = computed(
  () => store.tieBreakSections[store.tieBreakSectionIndex],
)
const tieBreakWinnerName = computed(() =>
  store.tieBreakWinner === 'home' ? homeName.value : awayName.value,
)
const currentTieBreakTotals = computed(() => {
  const section = currentTieBreakSection.value
  if (!section) return { home: 0, away: 0 }
  const marks = section.questions.map((_, questionIndex) =>
    tieBreakMark(questionIndex),
  )
  return {
    home: marks.filter((mark) => mark.home === true).length,
    away: marks.filter((mark) => mark.away === true).length,
  }
})
const currentTieBreakComplete = computed(() => {
  const section = currentTieBreakSection.value
  if (!section) return false
  return section.questions.every((_, questionIndex) => {
    const mark = tieBreakMark(questionIndex)
    return mark.home !== undefined && mark.away !== undefined
  })
})

const tieBreakMark = (questionIndex: number) =>
  store.tieBreakMarks[store.tieBreakKey(store.tieBreakSectionIndex, questionIndex)] ?? {}

const setTieBreakMark = (questionIndex: number, side: 'home' | 'away', value: unknown) => {
  store.recordTieBreakAnswer(store.tieBreakSectionIndex, questionIndex, side, Boolean(value))
}

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

const passedOver = ref(false)

// When the owning team has no contestant assigned to this category, the
// question is taken over by the opposing team's contestant: it is treated as
// already passed over, so a correct answer scores as a bonus (1 point to the
// opposition) rather than 2 to the owner.
const autoPassed = computed(
  () =>
    Boolean(
      subject.value &&
        question.value &&
        !store.contestantFor(roundIndex.value, question.value, owner.value),
    ),
)
const effectivePassedOver = computed(() => passedOver.value || autoPassed.value)

const targetSide = computed(() =>
  effectivePassedOver.value ? (owner.value === 'home' ? 'away' : 'home') : owner.value,
)

const contestantName = computed(() => {
  if (!subject.value || !question.value) return ''
  return store.contestantFor(roundIndex.value, question.value, targetSide.value) ?? '—'
})

const targetName = computed(() => (targetSide.value === 'home' ? homeName.value : awayName.value))

const canGoBack = computed(() => roundIndex.value > 0 || questionIndex.value > 0)

const displayQuestion = computed(() => spare.value?.question ?? question.value?.question ?? '')
const displayAnswer = computed(() => spare.value?.answer ?? question.value?.answer ?? '')
const questionHtml = computed(() => underlineHtml(displayQuestion.value))
const answerHtml = computed(() => underlineHtml(displayAnswer.value))

type TimerState = 'idle' | 'running' | 'paused' | 'done'

const timerState = ref<TimerState>('idle')
const answerRevealed = ref(false)
const remaining = ref(30)
let timerHandle: ReturnType<typeof setInterval> | undefined

const timerDuration = computed(() => (effectivePassedOver.value ? 15 : 30))
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
  return 'success'
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
  answerRevealed.value = false
}

function resumeTimer() {
  timerState.value = 'running'
  answerRevealed.value = true
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
  next()
}

function passOver() {
  passedOver.value = true
  // The other team now has the shorter countdown: start it right away.
  startTimer()
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
  } else if (store.shouldPlayTieBreak) {
    phase.value = 'tiebreak'
  } else {
    phase.value = 'beer'
  }
  persistPosition()
}

function back() {
  resetQuestionState()

  if (questionIndex.value > 0) {
    questionIndex.value -= 1
  } else if (roundIndex.value > 0) {
    roundIndex.value -= 1
    const previousRound = store.scoredRounds[roundIndex.value]
    questionIndex.value = Math.max(0, (previousRound?.questions.length ?? 1) - 1)
    settingUpIndividual.value = Boolean(
      previousRound &&
        isIndividualRound(previousRound) &&
        !store.categoryAssignments[roundIndex.value],
    )
  }
  persistPosition()
}

function persistPosition() {
  store.updateMatchPosition({
    roundIndex: roundIndex.value,
    questionIndex: questionIndex.value,
    phase: phase.value,
  })
}

function goToBeer() {
  phase.value = 'beer'
  persistPosition()
}

function goToTieBreak() {
  phase.value = 'tiebreak'
  persistPosition()
}

function finishTieBreak() {
  persistPosition()
  emit('done')
}

function goToRounds() {
  phase.value = 'rounds'
  persistPosition()
}

function onRoundSetupSaved() {
  settingUpIndividual.value = false
  persistPosition()
}

function finishBeer() {
  store.recordBeerRound(beerHome.value, beerAway.value)
  persistPosition()
  emit('done')
}
</script>
<style scoped>
.match-header-title {
  padding-right: 100px;
}

.score-line {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0.5ch;
}

.match-score {
  font-size: 1.5rem;
  line-height: 1.3;
}

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

@media (max-width: 600px) {
  .match-header-title {
    flex-direction: column;
    align-items: stretch;
    justify-content: flex-start;
    gap: 8px;
    padding-right: 16px;
  }

  .match-score {
    font-size: 1.25rem;
    line-height: 1.3;
    padding-right: 88px;
  }
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

.scoresheet-round-row td {
  background: rgba(var(--v-theme-on-surface), 0.04);
}

.scoresheet-total-row td {
  background: rgba(var(--v-theme-on-surface), 0.02);
}
</style>
