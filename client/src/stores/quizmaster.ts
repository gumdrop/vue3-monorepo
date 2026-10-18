import axios from 'axios'
import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type { QuizPaper, QuizQuestion, QuizQuestionOutcome, QuizReportCommand, QuizRound } from '@quizleague/shared'
import { applyOutcome, initialScore, isIndividualRound, jokerApplies, owningSide, subjectForQuestion, type Score, type TeamSide } from '@/services/QuizScoring'
import { REST_ROOT } from '@/services/constants'
import { useUserStore } from './app'

export interface SelectedFixture {
  path: string
  date: string
  homeName: string
  awayName: string
}

export interface InvokedSpare {
  number: string
  question: string
  answer: string
}

interface HistoryEntry {
  score: Score
  key: string
}

const isBeerRound = (round: QuizRound) => /beer/i.test(round.round)
const isSparesRound = (round: QuizRound) => !isBeerRound(round) && /spare/i.test(round.round)
const isTiebreakRound = (round: QuizRound) => /tiebreak/i.test(round.round)
const isScoredRound = (round: QuizRound) =>
  !isBeerRound(round) && !isSparesRound(round) && !isTiebreakRound(round)

export const useQuizmasterStore = defineStore('quizmaster', () => {
  const fixture = ref<SelectedFixture>()
  const fixtureDate = ref<string>()
  const homeIsAFirstHalf = ref(true)
  const homePlayers = ref<string[]>([])
  const awayPlayers = ref<string[]>([])

  const quiz = ref<QuizPaper>()
  const acquiring = ref(false)
  const acquireError = ref<string>()

  const outcomes = ref<Record<string, QuizQuestionOutcome>>({})
  const spares = ref<Record<string, InvokedSpare>>({})
  const spareCursor = ref<{ A: number; B: number }>({ A: 0, B: 0 })
  const jokers = ref<Record<number, { home?: string; away?: string }>>({})
  const categoryAssignments = ref<
    Record<number, { home: Record<string, string>; away: Record<string, string> }>
  >({})

  const beerRoundScore = ref<{ home: number; away: number }>({ home: 0, away: 0 })
  const score = ref<Score>({ ...initialScore })
  const history = ref<HistoryEntry[]>([])

  const report = ref<{ text: string; model: string }>()
  const submitting = ref(false)
  const submitError = ref<string>()
  const submitted = ref(false)

  const scoredRounds = computed(() => (quiz.value?.rounds ?? []).filter(isScoredRound))
  const sparesRound = computed(() => (quiz.value?.rounds ?? []).find(isSparesRound))
  const beerRound = computed(() => (quiz.value?.rounds ?? []).find(isBeerRound))
  const tiebreakRound = computed(() => (quiz.value?.rounds ?? []).find(isTiebreakRound))

  const spareSet = (suffix: 'A' | 'B'): QuizQuestion[] =>
    (sparesRound.value?.questions ?? []).filter((q) =>
      q.number.trim().toUpperCase().endsWith(suffix),
    )

  const questionKey = (roundIndex: number, questionIndex: number) => `${roundIndex}:${questionIndex}`

  const suffixFor = (question: QuizQuestion): 'A' | 'B' => {
    const last = question.number.trim().slice(-1).toUpperCase()
    return last === 'B' ? 'B' : 'A'
  }

  const ownerFor = (roundIndex: number, question: QuizQuestion): TeamSide =>
    owningSide(roundIndex + 1, suffixFor(question), homeIsAFirstHalf.value)

  const scoringJoker = (
    owner: TeamSide,
    roundIndex: number,
    question: QuizQuestion,
    outcome: QuizQuestionOutcome,
  ): boolean => {
    const round = scoredRounds.value[roundIndex]
    if (!isIndividualRound(round)) return false

    const category = subjectForQuestion(question.number, round.subjects ?? [])
    const scoringSide: TeamSide = outcome === 'bonus' ? (owner === 'home' ? 'away' : 'home') : owner
    return jokerApplies(scoringSide, category, jokers.value[roundIndex] ?? {})
  }

  const subjectFor = (roundIndex: number, question: QuizQuestion): string | undefined => {
    const round = scoredRounds.value[roundIndex]
    if (!round || !isIndividualRound(round)) return undefined
    return subjectForQuestion(question.number, round.subjects ?? [])
  }

  const contestantFor = (
    roundIndex: number,
    question: QuizQuestion,
    side: TeamSide,
  ): string | undefined => {
    const subject = subjectFor(roundIndex, question)
    if (!subject) return undefined
    return categoryAssignments.value[roundIndex]?.[side]?.[subject]
  }

  async function acquire(date: string, password: string): Promise<boolean> {
    acquiring.value = true
    acquireError.value = undefined
    try {
      const response = await axios.post<QuizPaper>(`${REST_ROOT}/quiz/acquire`, {
        fixtureDate: date,
        password,
      })
      quiz.value = response.data
      fixtureDate.value = date
      outcomes.value = {}
      spares.value = {}
      spareCursor.value = { A: 0, B: 0 }
      jokers.value = {}
      categoryAssignments.value = {}
      beerRoundScore.value = { home: 0, away: 0 }
      score.value = { ...initialScore }
      history.value = []
      return true
    } catch (error) {
      acquireError.value = errorMessage(error, 'Could not acquire the quiz')
      return false
    } finally {
      acquiring.value = false
    }
  }

  function recordOutcome(
    roundIndex: number,
    questionIndex: number,
    outcome: QuizQuestionOutcome,
  ) {
    const key = questionKey(roundIndex, questionIndex)
    const question = scoredRounds.value[roundIndex]?.questions[questionIndex]
    if (!question) return

    const owner = ownerFor(roundIndex, question)
    const joker = scoringJoker(owner, roundIndex, question, outcome)

    history.value.push({ score: { ...score.value }, key })
    score.value = applyOutcome(score.value, owner, outcome, joker)
    outcomes.value[key] = outcome
  }

  function undo() {
    const entry = history.value.pop()
    if (!entry) return
    score.value = entry.score
    delete outcomes.value[entry.key]
  }

  function invokeSpare(roundIndex: number, questionIndex: number): InvokedSpare | undefined {
    const question = scoredRounds.value[roundIndex]?.questions[questionIndex]
    if (!question) return undefined

    const suffix = suffixFor(question)
    const pool = spareSet(suffix)
    const cursor = spareCursor.value[suffix]
    const spare = pool[cursor]
    if (!spare) return undefined

    const key = questionKey(roundIndex, questionIndex)
    spares.value[key] = { number: spare.number, question: spare.question, answer: spare.answer }
    spareCursor.value[suffix] = cursor + 1
    return spares.value[key]
  }

  function recordBeerRound(home: number, away: number) {
    beerRoundScore.value = { home, away }
  }

  async function generateReport(): Promise<boolean> {
    if (!fixture.value) return false

    const command: QuizReportCommand = {
      homeTeam: fixture.value.homeName,
      awayTeam: fixture.value.awayName,
      homeScore: score.value.home,
      awayScore: score.value.away,
      beerRoundHomeScore: beerRoundScore.value.home,
      beerRoundAwayScore: beerRoundScore.value.away,
      rounds: scoredRounds.value.map((round, roundIndex) => ({
        name: round.round,
        questions: round.questions.map((question, questionIndex) => {
          const key = questionKey(roundIndex, questionIndex)
          const spare = spares.value[key]
          const individual = isIndividualRound(round)
          const category = individual
            ? subjectForQuestion(question.number, round.subjects ?? [])
            : undefined
          const owner = ownerFor(roundIndex, question)
          const contestant = individual
            ? contestantFor(roundIndex, question, owner)
            : owner === 'home'
              ? fixture.value.homeName
              : fixture.value.awayName
          const homeJoker = category ? jokers.value[roundIndex]?.home === category : false
          const awayJoker = category ? jokers.value[roundIndex]?.away === category : false

          return {
            number: question.number,
            question: stripUnderlineMarkers(spare?.question ?? question.question),
            answer: stripUnderlineMarkers(spare?.answer ?? question.answer),
            outcome: outcomes.value[key] ?? 'unanswered',
            category,
            contestant,
            joker:
              homeJoker && awayJoker ? 'both' : homeJoker ? 'home' : awayJoker ? 'away' : undefined,
          }
        }),
      })),
    }

    try {
      const response = await axios.post<{ text: string; model: string }>(
        `${REST_ROOT}/quiz/report`,
        command,
      )
      report.value = response.data
      return true
    } catch (error) {
      submitError.value = errorMessage(error, 'Could not generate the match report')
      return false
    }
  }

  async function submit(): Promise<boolean> {
    const user = useUserStore().user
    if (!fixture.value || !user) {
      submitError.value = 'You must be signed in and have selected a fixture'
      return false
    }

    submitting.value = true
    submitError.value = undefined
    try {
      await axios.post(
        `${REST_ROOT}/result/submit`,
        {
          fixtures: [
            {
              fixturePath: fixture.value.path,
              homeScore: score.value.home,
              awayScore: score.value.away,
            },
          ],
          reportText: report.value?.text,
          userID: user.siteUser.user?.id,
        },
        { headers: { 'Content-type': 'application/json' } },
      )
      submitted.value = true
      return true
    } catch (error) {
      submitError.value = errorMessage(error, 'Could not submit the result')
      return false
    } finally {
      submitting.value = false
    }
  }

  return {
    fixture,
    fixtureDate,
    homeIsAFirstHalf,
    homePlayers,
    awayPlayers,
    quiz,
    acquiring,
    acquireError,
    outcomes,
    spares,
    jokers,
    categoryAssignments,
    beerRoundScore,
    score,
    report,
    submitting,
    submitError,
    submitted,
    scoredRounds,
    sparesRound,
    beerRound,
    tiebreakRound,
    ownerFor,
    subjectFor,
    contestantFor,
    spareSet,
    questionKey,
    acquire,
    recordOutcome,
    undo,
    invokeSpare,
    recordBeerRound,
    generateReport,
    submit,
  }
})

function errorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const message = (error.response?.data as string | undefined) ?? error.message
    return typeof message === 'string' && message ? message : fallback
  }
  return fallback
}

function stripUnderlineMarkers(text: string): string {
  return text.replace(/<\/?u>/g, '')
}
