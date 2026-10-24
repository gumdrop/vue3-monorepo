import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
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

  it('shows Invoke spare question with Correct and Pass Over, disabled until the timer starts', async () => {
    wrapper = mountMatch()

    expect(findButton(wrapper, 'Correct').exists()).toBe(true)
    expect(findButton(wrapper, 'Pass Over').exists()).toBe(true)

    const invokeSpare = findButton(wrapper, 'Invoke spare question')
    expect(invokeSpare.attributes('disabled')).toBeDefined()

    await wrapper.find('button.timer-fab').trigger('click')

    expect(findButton(wrapper, 'Invoke spare question').attributes('disabled')).toBeUndefined()
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

    // Start the timer so the Pass Over button becomes enabled.
    await wrapper.find('button.timer-fab').trigger('click')
    await findButton(wrapper, 'Pass Over').trigger('click')

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
})
