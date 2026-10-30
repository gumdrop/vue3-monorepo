import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { nextTick } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { QuizPaper } from '@quizleague/shared'
import { saveQuizSession } from '@/services/QuizMasterSession'
import { useQuizmasterStore } from '@/stores/quizmaster'
import { siteComponentStubs } from '../../__tests__/componentStubs'
import QuizMasterMatch from '../QuizMasterMatch.vue'

const mocks = vi.hoisted(() => ({
  onAuthStateChanged: vi.fn(),
  getDoc: vi.fn(),
  useFirebaseAuth: vi.fn(),
  siteUserForUid: vi.fn(),
  teamForUser: vi.fn(),
}))

vi.mock('firebase/auth', () => ({
  onAuthStateChanged: mocks.onAuthStateChanged,
}))

vi.mock('firebase/firestore', () => ({
  getDoc: mocks.getDoc,
}))

vi.mock('vuefire', () => ({
  useFirebaseAuth: mocks.useFirebaseAuth,
}))

vi.mock('@/dao/ApplicationContextDAO', () => ({
  default: { get: vi.fn() },
}))

vi.mock('@/dao/SiteUserDAO', () => ({
  default: { siteUserForUid: mocks.siteUserForUid },
}))

vi.mock('@/services/TeamService', () => ({
  useTeams: () => ({ teamForUser: mocks.teamForUser }),
}))

vi.mock('@/services/QuizMasterSession', () => ({
  saveQuizSession: vi.fn(),
  loadQuizSession: vi.fn().mockResolvedValue(undefined),
  clearQuizSession: vi.fn(),
}))

const quizPaper = (): QuizPaper => ({
  rounds: [
    { round: 'ROUND ONE', questions: [{ number: '1A', question: 'Original question?', answer: 'Original answer' }] },
    {
      round: 'SPARES A & B',
      questions: [{ number: '1A', question: 'Spare question?', answer: 'Spare answer' }],
    },
  ],
})

const findButton = (wrapper: VueWrapper, text: string) => {
  const button = wrapper
    .findAll('button')
    .find((candidate) => candidate.text().includes(text))
  expect(button, `button with text "${text}"`).toBeDefined()
  return button!
}

const mountMatch = () => {
  const store = useQuizmasterStore()
  store.fixture = {
    path: 'season/season-1/competition/league/fixtures/set-1/fixture/f-1',
    date: '2026-10-13',
    homeName: 'Home Team',
    awayName: 'Away Team',
    homeId: 'home',
    awayId: 'away',
  }
  store.quiz = quizPaper()

  return mount(QuizMasterMatch, {
    global: { stubs: siteComponentStubs },
  })
}

describe('QuizMasterMatch', () => {
  let wrapper: VueWrapper

  beforeEach(() => {
    vi.clearAllMocks()
    setActivePinia(createPinia())
  })

  afterEach(() => {
    wrapper?.unmount()
  })

  it('shows the current scoresheet on demand', async () => {
    wrapper = mountMatch()
    const store = useQuizmasterStore()
    store.recordOutcome(0, 0, 'correct')

    await findButton(wrapper, 'Scoresheet').trigger('click')

    expect(wrapper.text()).toContain('Scoresheet')
    expect(wrapper.text()).toContain('ROUND ONE')
    expect(wrapper.text()).toContain('Correct')
    expect(wrapper.text()).toContain('+2 Home Team')
    expect(wrapper.text()).toContain('Running total: Home Team 2 — 0 Away Team')
  })

  it('shows Invoke spare question with Correct and Pass Across, disabled until the timer starts', async () => {
    wrapper = mountMatch()

    expect(findButton(wrapper, 'Correct').exists()).toBe(true)
    expect(findButton(wrapper, 'Pass Across').exists()).toBe(true)

    const invokeSpare = findButton(wrapper, 'Invoke spare question')
    expect(invokeSpare.attributes('disabled')).toBeDefined()

    await wrapper.find('button.timer-fab').trigger('click')

    expect(findButton(wrapper, 'Invoke spare question').attributes('disabled')).toBeUndefined()
  })

  it('hides the answer while the timer is paused and reveals it again on resume', async () => {
    wrapper = mountMatch()

    await wrapper.find('button.timer-fab').trigger('click')
    expect(wrapper.text()).toContain('Original answer')

    // Pausing via the timer toggle hides the answer.
    await wrapper.find('button.timer-fab').trigger('click')
    expect(wrapper.text()).toContain('Answer hidden')
    expect(wrapper.text()).not.toContain('Original answer')

    // Resuming reveals it again.
    await wrapper.find('button.timer-fab').trigger('click')
    expect(wrapper.text()).toContain('Original answer')
  })

  it('advances to the next question when an outcome is recorded', async () => {
    const store = useQuizmasterStore()
    store.fixture = {
      path: 'season/season-1/competition/league/fixtures/set-1/fixture/f-1',
      date: '2026-10-13',
      homeName: 'Home Team',
      awayName: 'Away Team',
      homeId: 'home',
      awayId: 'away',
    }
    store.quiz = {
      rounds: [
        {
          round: 'ROUND ONE',
          questions: [
            { number: '1A', question: 'First question?', answer: 'First answer' },
            { number: '1B', question: 'Second question?', answer: 'Second answer' },
          ],
        },
      ],
    }

    wrapper = mount(QuizMasterMatch, { global: { stubs: siteComponentStubs } })

    await wrapper.find('button.timer-fab').trigger('click')
    await findButton(wrapper, 'Correct (+2)').trigger('click')

    expect(store.outcomes['0:0']).toBe('correct')
    expect(wrapper.text()).toContain('Second question?')
    expect(wrapper.text()).not.toContain('First question?')
  })

  it('shows a Back button that returns to the previous question', async () => {
    const store = useQuizmasterStore()
    store.fixture = {
      path: 'season/season-1/competition/league/fixtures/set-1/fixture/f-1',
      date: '2026-10-13',
      homeName: 'Home Team',
      awayName: 'Away Team',
      homeId: 'home',
      awayId: 'away',
    }
    store.quiz = {
      rounds: [
        {
          round: 'ROUND ONE',
          questions: [
            { number: '1A', question: 'First question?', answer: 'First answer' },
            { number: '1B', question: 'Second question?', answer: 'Second answer' },
          ],
        },
      ],
    }
    store.matchPosition = { roundIndex: 0, questionIndex: 1, phase: 'rounds' }

    wrapper = mount(QuizMasterMatch, { global: { stubs: siteComponentStubs } })

    expect(wrapper.text()).toContain('Second question?')
    await findButton(wrapper, 'Back').trigger('click')
    expect(wrapper.text()).toContain('First question?')
    expect(wrapper.text()).not.toContain('Second question?')

    // The first question has no previous question to return to.
    expect(findButton(wrapper, 'Back').attributes('disabled')).toBeDefined()
  })

  it('keeps the answer visible when the countdown reaches zero', async () => {
    vi.useFakeTimers()
    try {
      wrapper = mountMatch()

      await wrapper.find('button.timer-fab').trigger('click')
      vi.advanceTimersByTime(30_000)
      await nextTick()

      expect(wrapper.find('button.timer-fab').text()).toContain('Time')
      expect(wrapper.text()).toContain('Original answer')
      expect(wrapper.text()).not.toContain('Answer hidden')
    } finally {
      vi.useRealTimers()
    }
  })

  it('invokes a spare and resets the timer when clicked', async () => {
    wrapper = mountMatch()
    const store = useQuizmasterStore()

    await wrapper.find('button.timer-fab').trigger('click')
    await findButton(wrapper, 'Invoke spare question').trigger('click')

    expect(store.spares['0:0']).toEqual({
      number: '1A',
      question: 'Spare question?',
      answer: 'Spare answer',
    })

    // The replacement question is shown and the button disappears.
    expect(wrapper.text()).toContain('Original question replaced with spare')
    expect(wrapper.text()).toContain('Spare question?')
    expect(
      wrapper.findAll('button').some((button) => button.text().includes('Invoke spare question')),
    ).toBe(false)

    // The timer is reset back to its idle state.
    expect(wrapper.find('button.timer-fab').text()).toContain('Start')
  })

  it('starts the countdown immediately when the question is passed over', async () => {
    wrapper = mountMatch()

    // Start the timer so the Pass Across button becomes enabled.
    await wrapper.find('button.timer-fab').trigger('click')
    await findButton(wrapper, 'Pass Across').trigger('click')

    // The shorter passed-over countdown (15s) is already running.
    const timerFab = wrapper.find('button.timer-fab')
    expect(timerFab.text()).toContain('15')
    expect(timerFab.text()).not.toContain('Start')

    // Bonus/incorrect buttons are enabled without a further timer press.
    expect(findButton(wrapper, 'Correct (+1)').attributes('disabled')).toBeUndefined()
    expect(findButton(wrapper, 'Incorrect').attributes('disabled')).toBeUndefined()
  })

  it('allocates spares in printed order rather than by A/B', () => {
    const store = useQuizmasterStore()
    store.quiz = {
      rounds: [
        {
          round: 'ROUND ONE',
          questions: [
            { number: '1A', question: 'Q1A?', answer: 'A1A' },
            { number: '1B', question: 'Q1B?', answer: 'A1B' },
          ],
        },
        {
          round: 'SPARES A & B',
          questions: [
            { number: '1A', question: 'Spare 1A?', answer: 'Spare A1A' },
            { number: '1B', question: 'Spare 1B?', answer: 'Spare A1B' },
            { number: '2A', question: 'Spare 2A?', answer: 'Spare A2A' },
            { number: '2B', question: 'Spare 2B?', answer: 'Spare A2B' },
          ],
        },
      ],
    }

    // Triggering a B-question spare still takes the first printed spare (1A).
    expect(store.invokeSpare(0, 1)?.number).toBe('1A')
    // Subsequent spares continue in printed order regardless of A/B.
    expect(store.invokeSpare(0, 0)?.number).toBe('1B')
    expect(store.invokeSpare(0, 0)?.number).toBe('2A')
    expect(store.invokeSpare(0, 1)?.number).toBe('2B')
  })

  it('persists sessions without an undefined report field', async () => {
    const store = useQuizmasterStore()
    store.fixture = {
      path: 'season/season-1/competition/league/fixtures/set-1/fixture/f-1',
      date: '2026-10-13',
      homeName: 'Home Team',
      awayName: 'Away Team',
      homeId: 'home',
      awayId: 'away',
    }

    store.setResumeStep(3)
    await flushPromises()

    const session = vi.mocked(saveQuizSession).mock.calls[0]?.[1] as Record<string, unknown>
    expect(session).toBeDefined()
    expect('report' in session).toBe(false)
  })

  it('auto-passes an individual question to the opposition when the owner has no contestant', () => {
    const store = useQuizmasterStore()
    store.fixture = {
      path: 'season/season-1/competition/league/fixtures/set-1/fixture/f-1',
      date: '2026-10-13',
      homeName: 'Home Team',
      awayName: 'Away Team',
      homeId: 'home',
      awayId: 'away',
    }
    store.quiz = {
      rounds: [
        {
          round: 'ROUND THREE - INDIVIDUAL',
          subjects: ['History', 'Geography'],
          questions: [{ number: '1A', question: 'History question?', answer: 'Answer' }],
        },
      ],
    }
    // Home owns '1A' in the first half but has no contestant in History, so the
    // question is taken over by Away's contestant (Dave) and scores as a bonus.
    store.categoryAssignments[0] = {
      home: { Geography: 'Alice' },
      away: { History: 'Dave' },
    }

    wrapper = mount(QuizMasterMatch, { global: { stubs: siteComponentStubs } })

    // The opposing contestant is shown as the target.
    expect(wrapper.text()).toContain('Dave')

    // The question is already passed over: bonus buttons, no Pass Across button.
    expect(findButton(wrapper, 'Correct (+1)').exists()).toBe(true)
    expect(findButton(wrapper, 'Incorrect').exists()).toBe(true)
    expect(
      wrapper.findAll('button').some((button) => button.text().includes('Pass Across')),
    ).toBe(false)
  })

  describe('cup tie-break store decisions', () => {
    const cupFixture = () => ({
      path: 'season/season-1/competition/cup/fixtures/set-1/fixture/f-1',
      date: '2026-10-13',
      homeName: 'Home Team',
      awayName: 'Away Team',
      homeId: 'home',
      awayId: 'away',
      isCup: true,
    })

    const cupTieQuiz = (): QuizPaper => ({
      rounds: [
        {
          round: 'ROUND ONE',
          questions: [
            { number: '1A', question: 'Home own?', answer: 'A' },
            { number: '1B', question: 'Away own?', answer: 'B' },
          ],
        },
        {
          round: 'SPARES A & B',
          questions: [{ number: '1A', question: 'Spare?', answer: 'S' }],
        },
      ],
    })

    it('detects a cup match tied after 10 rounds', () => {
      const store = useQuizmasterStore()
      store.fixture = cupFixture()
      store.score = { home: 4, away: 4 }
      store.quiz = cupTieQuiz()

      expect(store.shouldPlayTieBreak).toBe(true)
      expect(store.tieBreakSections).toHaveLength(1)
      expect(store.tieBreakSections[0]).toMatchObject({ kind: 'spares' })
    })

    it('decides a cup tie-break when a spare section has a winner', () => {
      const store = useQuizmasterStore()
      store.fixture = cupFixture()
      store.score = { home: 10, away: 10 }
      store.quiz = {
        rounds: [
          {
            round: 'ROUND ONE',
            questions: [{ number: '1A', question: 'Q?', answer: 'A' }],
          },
          {
            round: 'SPARES A & B',
            questions: [
              { number: '1A', question: 'S1?', answer: 'A1' },
              { number: '1B', question: 'S2?', answer: 'A2' },
            ],
          },
        ],
      }

      store.recordTieBreakAnswer(0, 0, 'home', true)
      store.recordTieBreakAnswer(0, 0, 'away', false)
      store.recordTieBreakAnswer(0, 1, 'home', true)
      store.recordTieBreakAnswer(0, 1, 'away', true)

      expect(store.tieBreakWinner).toBe('home')
      expect(store.submissionScore).toEqual({ home: 11, away: 10 })
    })

    it('falls back to most own questions answered correctly when sections are level', () => {
      const store = useQuizmasterStore()
      store.fixture = cupFixture()
      store.score = { home: 2, away: 2 }
      store.quiz = cupTieQuiz()
      store.tieBreakMarks['0:0'] = { home: true, away: true }
      store.outcomes['0:0'] = 'correct'
      store.outcomes['0:1'] = 'bonus'

      expect(store.tieBreakSectionWinners[0]).toBeUndefined()
      expect(store.tieBreakWinner).toBe('home')
      expect(store.tieBreakMethod).toBe('most own questions answered correctly')
    })

    it('uses a coin toss when sections and stats are all level', () => {
      const store = useQuizmasterStore()
      store.fixture = cupFixture()
      store.score = { home: 0, away: 0 }
      store.quiz = cupTieQuiz()
      store.tieBreakMarks['0:0'] = { home: true, away: true }

      expect(store.tieBreakWinner).toBeUndefined()

      store.setTieBreakCoinTossAwayCall('tails')
      store.setTieBreakCoinTossResult('heads')

      expect(store.tieBreakWinner).toBe('home')
      expect(store.tieBreakMethod).toBe('the coin toss')
    })
  })
})
