import { mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { QuizPaper } from '@quizleague/shared'
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
})
