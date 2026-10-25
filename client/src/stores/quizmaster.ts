import axios from 'axios'
import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type { QuizPaper, QuizQuestion, QuizQuestionOutcome, QuizReportCommand, QuizRound } from '@quizleague/shared'
import {
  applyOutcome,
  bonusCorrectCounts,
  buildTieBreakSections,
  coinTossWinner,
  initialScore,
  isIndividualRound,
  jokerApplies,
  outcomePoints,
  ownCorrectCounts,
  owningSide,
  subjectForQuestion,
  tieBreakSectionWinner,
  type Score,
  type TeamSide,
  type TieBreakMarks,
  type TieBreakSection,
} from '@/services/QuizScoring'
import { REST_ROOT } from '@/services/constants'
import { clearQuizSession, loadQuizSession, saveQuizSession, type QuizSession } from '@/services/QuizMasterSession'
import type Team from '@/entity/Team'
import { useUserStore } from './app'

export interface SelectedFixture {
  path: string
  date: string
  homeName: string
  awayName: string
  homeId: string
  awayId: string
  isCup?: boolean
  homeTeam?: Team
  awayTeam?: Team
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

export type MatchPhase = 'rounds' | 'tiebreak' | 'beer'
export interface MatchPosition {
  roundIndex: number
  questionIndex: number
  phase: MatchPhase
}

export interface ScoresheetEntry {
  number: string
  owner: TeamSide
  outcome?: QuizQuestionOutcome
  category?: string
  contestant?: string
  joker?: 'home' | 'away' | 'both'
  points: number
  scoringSide: TeamSide
  spareInvoked: boolean
}

export interface ScoresheetRound {
  name: string
  entries: ScoresheetEntry[]
  homePoints: number
  awayPoints: number
  homeTotal: number
  awayTotal: number
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
  const spareCursor = ref(0)
  const jokers = ref<Record<number, { home?: string; away?: string }>>({})
  const categoryAssignments = ref<
    Record<number, { home: Record<string, string>; away: Record<string, string> }>
  >({})

  const beerRoundScore = ref<{ home: number; away: number }>({ home: 0, away: 0 })
  const score = ref<Score>({ ...initialScore })
  const history = ref<HistoryEntry[]>([])

  const tieBreakMarks = ref<Record<string, TieBreakMarks>>({})
  const tieBreakSectionIndex = ref(0)
  const tieBreakCoinToss = ref<{ awayCall?: 'heads' | 'tails'; toss?: 'heads' | 'tails' }>({})

  const report = ref<{ text: string; model: string }>()
  const submitting = ref(false)
  const submitError = ref<string>()
  const submitted = ref(false)
  const submittedScore = ref<Score>()
  const submittedBeerRoundScore = ref<{ home: number; away: number }>()

  const resumeStep = ref<2 | 3 | 4>(2)
  const resuming = ref(false)
  const matchPosition = ref<MatchPosition>({ roundIndex: 0, questionIndex: 0, phase: 'rounds' })

  const scoredRounds = computed(() => (quiz.value?.rounds ?? []).filter(isScoredRound))
  const sparesRound = computed(() => (quiz.value?.rounds ?? []).find(isSparesRound))
  const beerRound = computed(() => (quiz.value?.rounds ?? []).find(isBeerRound))
  const tiebreakRound = computed(() => (quiz.value?.rounds ?? []).find(isTiebreakRound))

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
  ): boolean => {
    const round = scoredRounds.value[roundIndex]
    if (!isIndividualRound(round)) return false

    const category = subjectForQuestion(question.number, round.subjects ?? [])
    return jokerApplies(owner, category, jokers.value[roundIndex] ?? {})
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

  const isCup = computed(() => fixture.value?.isCup === true)
  const isTied = computed(() => score.value.home === score.value.away)
  const shouldPlayTieBreak = computed(() => isCup.value && isTied.value)

  const tieBreakKey = (sectionIndex: number, questionIndex: number) => `${sectionIndex}:${questionIndex}`

  // Only the spares not already used as mid-match replacements are available
  // for the tie-break, in their printed order.
  const tieBreakSections = computed<TieBreakSection[]>(() => {
    if (!shouldPlayTieBreak.value) return []
    const remainingSpares = (sparesRound.value?.questions ?? []).slice(spareCursor.value)
    return buildTieBreakSections(remainingSpares, beerRound.value?.questions ?? [])
  })

  const tieBreakMarkFor = (sectionIndex: number, questionIndex: number): TieBreakMarks =>
    tieBreakMarks.value[tieBreakKey(sectionIndex, questionIndex)] ?? {}

  const tieBreakSectionComplete = (sectionIndex: number): boolean => {
    const section = tieBreakSections.value[sectionIndex]
    if (!section) return false
    return section.questions.every((_, questionIndex) => {
      const mark = tieBreakMarks.value[tieBreakKey(sectionIndex, questionIndex)]
      return mark?.home !== undefined && mark?.away !== undefined
    })
  }

  const tieBreakSectionWinners = computed<(TeamSide | undefined)[]>(() =>
    tieBreakSections.value.map((section, sectionIndex) => {
      if (!tieBreakSectionComplete(sectionIndex)) return undefined
      return tieBreakSectionWinner(
        section.questions.map((_, questionIndex) =>
          tieBreakMarkFor(sectionIndex, questionIndex),
        ),
      )
    }),
  )

  const outcomeEntries = computed(() =>
    scoredRounds.value.flatMap((round, roundIndex) =>
      round.questions.map((question, questionIndex) => ({
        outcome: outcomes.value[questionKey(roundIndex, questionIndex)] ?? 'unanswered',
        owner: ownerFor(roundIndex, question),
      })),
    ),
  )

  const ownQuestionCorrect = computed(() => ownCorrectCounts(outcomeEntries.value))
  const bonusQuestionCorrect = computed(() => bonusCorrectCounts(outcomeEntries.value))

  const tieBreakWinner = computed<TeamSide | undefined>(() => {
    if (!shouldPlayTieBreak.value) return undefined

    for (const winner of tieBreakSectionWinners.value) {
      if (winner) return winner
    }

    if (ownQuestionCorrect.value.home !== ownQuestionCorrect.value.away) {
      return ownQuestionCorrect.value.home > ownQuestionCorrect.value.away ? 'home' : 'away'
    }

    if (bonusQuestionCorrect.value.home !== bonusQuestionCorrect.value.away) {
      return bonusQuestionCorrect.value.home > bonusQuestionCorrect.value.away ? 'home' : 'away'
    }

    return coinTossWinner(tieBreakCoinToss.value.awayCall, tieBreakCoinToss.value.toss)
  })

  const tieBreakMethod = computed(() => {
    if (!tieBreakWinner.value) return undefined

    const decidingSectionIndex = tieBreakSectionWinners.value.findIndex((winner) => winner !== undefined)
    if (decidingSectionIndex >= 0) {
      const section = tieBreakSections.value[decidingSectionIndex]
      return `the ${section.name.toLowerCase()} tie-break`
    }

    if (ownQuestionCorrect.value.home !== ownQuestionCorrect.value.away) {
      return 'most own questions answered correctly'
    }

    if (bonusQuestionCorrect.value.home !== bonusQuestionCorrect.value.away) {
      return 'most bonus questions answered correctly'
    }

    return 'the coin toss'
  })

  const submissionScore = computed<Score>(() => {
    if (!tieBreakWinner.value || !shouldPlayTieBreak.value) return { ...score.value }
    return tieBreakWinner.value === 'home'
      ? { home: score.value.home + 1, away: score.value.away }
      : { home: score.value.home, away: score.value.away + 1 }
  })

  // A per-question ledger of the scored rounds, derived from recorded outcomes
  // so the question master can review the running scoresheet at any time.
  const scoresheet = computed<ScoresheetRound[]>(() => {
    let runningHome = 0
    let runningAway = 0

    return scoredRounds.value.map((round, roundIndex) => {
      const individual = isIndividualRound(round)
      const entries: ScoresheetEntry[] = round.questions.map((question, questionIndex) => {
        const key = questionKey(roundIndex, questionIndex)
        const owner = ownerFor(roundIndex, question)
        const outcome = outcomes.value[key]
        const category = individual ? subjectFor(roundIndex, question) : undefined
        const joker = scoringJoker(owner, roundIndex, question)
        const homeJoker = category ? jokers.value[roundIndex]?.home === category : false
        const awayJoker = category ? jokers.value[roundIndex]?.away === category : false

        return {
          number: question.number,
          owner,
          outcome,
          category,
          contestant: individual ? contestantFor(roundIndex, question, owner) : undefined,
          joker:
            homeJoker && awayJoker ? 'both' : homeJoker ? 'home' : awayJoker ? 'away' : undefined,
          points: outcome ? outcomePoints(outcome, joker) : 0,
          scoringSide: outcome === 'bonus' ? (owner === 'home' ? 'away' : 'home') : owner,
          spareInvoked: Boolean(spares.value[key]),
        }
      })

      const homePoints = entries
        .filter((entry) => entry.scoringSide === 'home')
        .reduce((total, entry) => total + entry.points, 0)
      const awayPoints = entries
        .filter((entry) => entry.scoringSide === 'away')
        .reduce((total, entry) => total + entry.points, 0)
      runningHome += homePoints
      runningAway += awayPoints

      return {
        name: round.round,
        entries,
        homePoints,
        awayPoints,
        homeTotal: runningHome,
        awayTotal: runningAway,
      }
    })
  })

  function buildSession(): Omit<QuizSession, 'fixturePath' | 'updatedAt'> {
    const session: Omit<QuizSession, 'fixturePath' | 'updatedAt'> = {
      homeIsAFirstHalf: homeIsAFirstHalf.value,
      homePlayers: [...homePlayers.value],
      awayPlayers: [...awayPlayers.value],
      outcomes: { ...outcomes.value },
      spares: { ...spares.value },
      spareCursor: spareCursor.value,
      jokers: jokers.value as QuizSession['jokers'],
      categoryAssignments: categoryAssignments.value as QuizSession['categoryAssignments'],
      beerRoundScore: { ...beerRoundScore.value },
      score: { ...score.value },
      history: history.value.map((entry) => ({ score: { ...entry.score }, key: entry.key })),
      step: resumeStep.value,
      matchPosition: { ...matchPosition.value },
      tieBreakMarks: { ...tieBreakMarks.value },
      tieBreakSectionIndex: tieBreakSectionIndex.value,
      tieBreakCoinToss: {
        awayCall: tieBreakCoinToss.value.awayCall ?? '',
        toss: tieBreakCoinToss.value.toss ?? '',
      },
    }
    // Firestore rejects `undefined` field values, so only attach the report
    // once one has actually been generated.
    if (report.value) {
      session.report = { ...report.value }
    }
    return session
  }

  // Persistence is best-effort: a failed save must not interrupt the match.
  async function persistSession() {
    const selectedFixture = fixture.value
    if (!selectedFixture) return

    try {
      await saveQuizSession(selectedFixture.path, buildSession())
    } catch (error) {
      // Surface persistence failures for diagnostics without interrupting.
      console.error('Failed to persist quiz session', error)
    }
  }

  // Restores a previously saved session for the selected fixture. The quiz
  // paper itself is not restored — it is re-parsed on re-acquire.
  async function restoreSession(): Promise<boolean> {
    const selectedFixture = fixture.value
    if (!selectedFixture) return false

    const session = await loadQuizSession(selectedFixture.path)
    if (!session) return false

    homeIsAFirstHalf.value = session.homeIsAFirstHalf
    homePlayers.value = [...session.homePlayers]
    awayPlayers.value = [...session.awayPlayers]
    outcomes.value = { ...session.outcomes }
    spares.value = { ...session.spares }
    spareCursor.value = session.spareCursor
    jokers.value = session.jokers as typeof jokers.value
    categoryAssignments.value = session.categoryAssignments as typeof categoryAssignments.value
    beerRoundScore.value = { ...session.beerRoundScore }
    score.value = { ...session.score }
    history.value = session.history.map((entry) => ({ score: { ...entry.score }, key: entry.key }))
    report.value = session.report ? { ...session.report } : undefined
    resumeStep.value = session.step
    matchPosition.value = { ...session.matchPosition }
    tieBreakMarks.value = { ...(session.tieBreakMarks ?? {}) }
    tieBreakSectionIndex.value = session.tieBreakSectionIndex ?? 0
    const coinToss = session.tieBreakCoinToss
    tieBreakCoinToss.value = {
      awayCall: coinToss?.awayCall ? (coinToss.awayCall as 'heads' | 'tails') : undefined,
      toss: coinToss?.toss ? (coinToss.toss as 'heads' | 'tails') : undefined,
    }
    resuming.value = true
    return true
  }

  function setResumeStep(next: 2 | 3 | 4) {
    resumeStep.value = next
    void persistSession()
  }

  function updateMatchPosition(position: MatchPosition) {
    matchPosition.value = { ...position }
    void persistSession()
  }

  function finishResume() {
    resuming.value = false
  }

  async function acquire(
    date: string,
    password: string,
    pdfBase64?: string,
  ): Promise<boolean> {
    acquiring.value = true
    acquireError.value = undefined
    try {
      const response = await axios.post<QuizPaper>(`${REST_ROOT}/quiz/acquire`, {
        fixtureDate: date,
        password,
        pdfBase64,
      })
      quiz.value = response.data
      fixtureDate.value = date
      // On resume, keep the restored progress; on a fresh start, clear it.
      if (!resuming.value) {
        outcomes.value = {}
        spares.value = {}
        spareCursor.value = 0
        jokers.value = {}
        categoryAssignments.value = {}
        beerRoundScore.value = { home: 0, away: 0 }
        score.value = { ...initialScore }
        history.value = []
        tieBreakMarks.value = {}
        tieBreakSectionIndex.value = 0
        tieBreakCoinToss.value = {}
      }
      void persistSession()
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
    const joker = scoringJoker(owner, roundIndex, question)

    history.value.push({ score: { ...score.value }, key })
    score.value = applyOutcome(score.value, owner, outcome, joker)
    outcomes.value[key] = outcome
    void persistSession()
  }

  function undo() {
    const entry = history.value.pop()
    if (!entry) return
    score.value = entry.score
    delete outcomes.value[entry.key]
    void persistSession()
  }

  function invokeSpare(roundIndex: number, questionIndex: number): InvokedSpare | undefined {
    const question = scoredRounds.value[roundIndex]?.questions[questionIndex]
    if (!question) return undefined

    // Spares are allocated strictly in printed order (1A, 1B, 2A, 2B, ...),
    // independent of which A/B question triggered the spare.
    const pool = sparesRound.value?.questions ?? []
    const spare = pool[spareCursor.value]
    if (!spare) return undefined

    const key = questionKey(roundIndex, questionIndex)
    spares.value[key] = { number: spare.number, question: spare.question, answer: spare.answer }
    spareCursor.value += 1
    void persistSession()
    return spares.value[key]
  }

  function recordBeerRound(home: number, away: number) {
    beerRoundScore.value = { home, away }
    void persistSession()
  }

  function recordTieBreakAnswer(
    sectionIndex: number,
    questionIndex: number,
    side: TeamSide,
    correct: boolean,
  ) {
    const section = tieBreakSections.value[sectionIndex]
    if (!section?.questions[questionIndex]) return

    const key = tieBreakKey(sectionIndex, questionIndex)
    tieBreakMarks.value[key] = { ...tieBreakMarks.value[key], [side]: correct }
    void persistSession()
  }

  function setTieBreakSectionIndex(next: number) {
    tieBreakSectionIndex.value = Math.max(0, Math.min(next, tieBreakSections.value.length))
    void persistSession()
  }

  function advanceTieBreakSection() {
    setTieBreakSectionIndex(tieBreakSectionIndex.value + 1)
  }

  function setTieBreakCoinTossAwayCall(awayCall: 'heads' | 'tails') {
    tieBreakCoinToss.value = { ...tieBreakCoinToss.value, awayCall }
    void persistSession()
  }

  function setTieBreakCoinTossResult(toss: 'heads' | 'tails') {
    tieBreakCoinToss.value = { ...tieBreakCoinToss.value, toss }
    void persistSession()
  }

  async function generateReport(): Promise<boolean> {
    const selectedFixture = fixture.value
    if (!selectedFixture) return false

    const command: QuizReportCommand = {
      homeTeam: selectedFixture.homeName,
      awayTeam: selectedFixture.awayName,
      homeScore: submissionScore.value.home,
      awayScore: submissionScore.value.away,
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
          const outcome = outcomes.value[key] ?? 'unanswered'
          const contestant = individual
            ? outcome === 'correct'
              ? givenName(contestantFor(roundIndex, question, owner))
              : undefined
            : owner === 'home'
              ? selectedFixture.homeName
              : selectedFixture.awayName
          const homeJoker = category ? jokers.value[roundIndex]?.home === category : false
          const awayJoker = category ? jokers.value[roundIndex]?.away === category : false

          return {
            number: question.number,
            question: stripUnderlineMarkers(spare?.question ?? question.question),
            answer: stripUnderlineMarkers(spare?.answer ?? question.answer),
            outcome,
            category,
            contestant,
            joker:
              homeJoker && awayJoker ? 'both' : homeJoker ? 'home' : awayJoker ? 'away' : undefined,
          }
        }),
      })),
      ...(tieBreakWinner.value && tieBreakMethod.value
        ? {
            tieBreak: {
              winner: tieBreakWinner.value,
              method: tieBreakMethod.value,
              sections: tieBreakSections.value.map((section, sectionIndex) => ({
                name: section.name,
                homeCorrect: section.questions.filter(
                  (_, questionIndex) => tieBreakMarkFor(sectionIndex, questionIndex).home === true,
                ).length,
                awayCorrect: section.questions.filter(
                  (_, questionIndex) => tieBreakMarkFor(sectionIndex, questionIndex).away === true,
                ).length,
              })),
            },
          }
        : {}),
    }

    try {
      const response = await axios.post<{ text: string; model: string }>(
        `${REST_ROOT}/quiz/report`,
        command,
      )
      report.value = response.data
      void persistSession()
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

    if (shouldPlayTieBreak.value && !tieBreakWinner.value) {
      submitError.value = 'The cup tie-break must produce a winner before submitting'
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
              homeScore: submissionScore.value.home,
              awayScore: submissionScore.value.away,
            },
          ],
          reportText: report.value?.text,
          userID: user.siteUser.user?.id,
        },
        { headers: { 'Content-type': 'application/json' } },
      )
      submitted.value = true
      submittedScore.value = { ...submissionScore.value }
      submittedBeerRoundScore.value = { ...beerRoundScore.value }
      try {
        await clearQuizSession(fixture.value.path)
      } catch {
        // Best-effort cleanup; a failed delete only leaves a stale session.
      }
      clearMatchSession()
      return true
    } catch (error) {
      submitError.value = errorMessage(error, 'Could not submit the result')
      return false
    } finally {
      submitting.value = false
    }
  }

  // Clears the recorded match data after a successful submit (FR-5.3). The
  // fixture, report, and submit confirmation snapshots are intentionally kept
  // so the result view can still show what was submitted.
  function clearMatchSession() {
    fixtureDate.value = undefined
    homeIsAFirstHalf.value = true
    homePlayers.value = []
    awayPlayers.value = []
    quiz.value = undefined
    acquireError.value = undefined
    outcomes.value = {}
    spares.value = {}
    spareCursor.value = 0
    jokers.value = {}
    categoryAssignments.value = {}
    beerRoundScore.value = { home: 0, away: 0 }
    score.value = { ...initialScore }
    history.value = []
    tieBreakMarks.value = {}
    tieBreakSectionIndex.value = 0
    tieBreakCoinToss.value = {}
    resuming.value = false
    resumeStep.value = 2
    matchPosition.value = { roundIndex: 0, questionIndex: 0, phase: 'rounds' }
  }

  function reset() {
    const selectedFixture = fixture.value
    clearMatchSession()
    fixture.value = undefined
    report.value = undefined
    submitted.value = false
    submittedScore.value = undefined
    submittedBeerRoundScore.value = undefined
    submitError.value = undefined
    submitting.value = false
    acquiring.value = false
    if (selectedFixture) {
      void clearQuizSession(selectedFixture.path).catch(() => {})
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
    submittedScore,
    submittedBeerRoundScore,
    resumeStep,
    resuming,
    matchPosition,
    scoredRounds,
    sparesRound,
    beerRound,
    tiebreakRound,
    isCup,
    isTied,
    shouldPlayTieBreak,
    tieBreakMarks,
    tieBreakSectionIndex,
    tieBreakCoinToss,
    tieBreakSections,
    tieBreakSectionWinners,
    tieBreakWinner,
    tieBreakMethod,
    ownQuestionCorrect,
    bonusQuestionCorrect,
    submissionScore,
    scoresheet,
    tieBreakKey,
    tieBreakMarkFor,
    ownerFor,
    subjectFor,
    contestantFor,
    questionKey,
    acquire,
    recordOutcome,
    undo,
    invokeSpare,
    recordBeerRound,
    recordTieBreakAnswer,
    setTieBreakSectionIndex,
    advanceTieBreakSection,
    setTieBreakCoinTossAwayCall,
    setTieBreakCoinTossResult,
    generateReport,
    submit,
    reset,
    restoreSession,
    setResumeStep,
    updateMatchPosition,
    finishResume,
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

function givenName(name?: string): string | undefined {
  const trimmed = name?.trim()
  return trimmed ? trimmed.split(/\s+/)[0] : undefined
}
