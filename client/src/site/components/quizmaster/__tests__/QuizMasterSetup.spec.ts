import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { computed, defineComponent, h } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useQuizmasterStore } from '@/stores/quizmaster'
import { siteComponentStubs } from '../../__tests__/componentStubs'
import QuizMasterSetup from '../QuizMasterSetup.vue'

const mocks = vi.hoisted(() => ({
  user: undefined as
    | { team?: { id: string }; siteUser?: { user?: { id?: string } } }
    | undefined,
  fixturesForResultSubmission: vi.fn(),
  fixtureDAO: { getDataByPath: vi.fn() },
  fixturesDAO: { getDataByPath: vi.fn() },
  teamDAO: { getDataById: vi.fn() },
  teamMemberDAO: { getDataForTeam: vi.fn() },
  userDAO: { getDataById: vi.fn() },
  date: vi.fn((value: string) => value),
  loadQuizSession: vi.fn(),
  axiosPost: vi.fn(),
}))

vi.mock('pinia', async (importOriginal) => {
  const actual = await importOriginal<typeof import('pinia')>()
  return {
    ...actual,
    storeToRefs: (store: { user?: unknown }) => ({
      user: computed(() => store.user),
    }),
  }
})

vi.mock('@/stores/app', () => ({
  useUserStore: () => ({ user: mocks.user }),
}))

vi.mock('@/services/FixtureService', () => ({
  useFixture: () => ({ fixturesForResultSubmission: mocks.fixturesForResultSubmission }),
}))

vi.mock('@/dao/FixturesDAO', () => ({
  default: mocks.fixturesDAO,
  fixtureDAO: mocks.fixtureDAO,
}))

vi.mock('@/dao/TeamDAO', () => ({ default: mocks.teamDAO }))

vi.mock('@/dao/TeamMemberDAO', () => ({ default: mocks.teamMemberDAO }))

vi.mock('@/dao/UserDAO', () => ({ default: mocks.userDAO }))

vi.mock('@/services/DateService', () => ({
  useDateTime: () => ({ date: mocks.date }),
}))

vi.mock('@/services/QuizMasterSession', () => ({
  saveQuizSession: vi.fn(),
  loadQuizSession: mocks.loadQuizSession,
  clearQuizSession: vi.fn(),
}))

vi.mock('axios', () => ({
  default: { post: mocks.axiosPost, isAxiosError: () => false },
}))

const FIXTURE_PATH = 'season/season-1/competition/cup/fixtures/set-1/fixture/f-1'

const fixture = (withResult: boolean) => ({
  id: 'f-1',
  path: FIXTURE_PATH,
  home: { id: 'home-team', path: 'team/home-team' },
  away: { id: 'away-team', path: 'team/away-team' },
  ...(withResult ? { result: { homeScore: 10, awayScore: 8 } } : {}),
})

const VRadioGroupStub = defineComponent({
  props: { label: String },
  setup(_, { slots }) {
    return () => h('div', { 'data-radio-group': 'true' }, slots.default?.())
  },
})

const VRadioStub = defineComponent({
  props: { label: String, value: [String, Boolean, Number] },
  setup(props) {
    return () => h('div', { 'data-radio': 'true' }, props.label)
  },
})

const VComboboxStub = defineComponent({
  props: { label: String, modelValue: [String, Array, Number] },
  setup(props) {
    return () => h('div', { 'data-combobox': props.label }, props.label)
  },
})

const mountSetup = async (): Promise<VueWrapper> => {
  const wrapper = mount(QuizMasterSetup, {
    global: {
      stubs: {
        ...siteComponentStubs,
        VRadioGroup: VRadioGroupStub,
        VRadio: VRadioStub,
        VCombobox: VComboboxStub,
      },
    },
  })
  await flushPromises()
  return wrapper
}

const session = () => ({
  fixturePath: FIXTURE_PATH,
  homeIsAFirstHalf: true,
  homePlayers: ['Alice', 'Bob', 'Carol'],
  awayPlayers: ['Dave', 'Eve', 'Frank'],
  outcomes: {},
  spares: {},
  spareCursor: { A: 0, B: 0 },
  jokers: {},
  categoryAssignments: {},
  beerRoundScore: { home: 0, away: 0 },
  score: { home: 2, away: 0 },
  history: [],
  step: 3,
  matchPosition: { roundIndex: 0, questionIndex: 1, phase: 'rounds' },
  updatedAt: '2026-10-24T00:00:00.000Z',
})

const quizPaper = () => ({ rounds: [] })

const acquireButton = (wrapper: VueWrapper) => {
  const button = wrapper
    .findAll('button')
    .find((candidate) => candidate.text().includes('Acquire quiz'))
  expect(button, 'Acquire quiz button').toBeDefined()
  return button!
}

describe('QuizMasterSetup', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setActivePinia(createPinia())

    mocks.user = { team: { id: 'team-1' } }
    mocks.fixturesForResultSubmission.mockResolvedValue([{ path: FIXTURE_PATH }])
    mocks.fixturesDAO.getDataByPath.mockResolvedValue({ date: '2026-10-13' })
    mocks.teamDAO.getDataById.mockImplementation(async (id: string) => ({
      name: id === 'home-team' ? 'Home Team' : 'Away Team',
    }))
    mocks.teamMemberDAO.getDataForTeam.mockResolvedValue({ users: [] })
    mocks.userDAO.getDataById.mockResolvedValue(undefined)
    mocks.loadQuizSession.mockResolvedValue(undefined)
    mocks.axiosPost.mockResolvedValue({ data: quizPaper() })
  })

  it('tells the user and blocks the quiz when the fixture already has a result', async () => {
    mocks.fixtureDAO.getDataByPath.mockResolvedValue(fixture(true))

    const wrapper = await mountSetup()

    expect(useQuizmasterStore().fixture).toBeDefined()
    expect(wrapper.text()).toContain('This fixture already has a result')
    expect(acquireButton(wrapper).attributes('disabled')).toBeDefined()
  })

  it('allows setup when the fixture has no result', async () => {
    mocks.fixtureDAO.getDataByPath.mockResolvedValue(fixture(false))

    const wrapper = await mountSetup()

    expect(wrapper.text()).not.toContain('This fixture already has a result')
  })

  it('notifies and restores an in-progress quiz for re-acquire', async () => {
    mocks.user = { team: { id: 'team-1' }, siteUser: { user: { id: 'user-1' } } }
    mocks.fixtureDAO.getDataByPath.mockResolvedValue(fixture(false))
    mocks.loadQuizSession.mockResolvedValue(session())

    const wrapper = await mountSetup()
    const store = useQuizmasterStore()

    expect(wrapper.text()).toContain('already in progress')
    expect(store.homePlayers).toEqual(['Alice', 'Bob', 'Carol'])
    expect(store.awayPlayers).toEqual(['Dave', 'Eve', 'Frank'])
    expect(store.score).toEqual({ home: 2, away: 0 })
    expect(store.resumeStep).toBe(3)
    expect(store.resuming).toBe(true)
  })

  it('re-acquires and emits resume to jump back to the saved step', async () => {
    mocks.user = { team: { id: 'team-1' }, siteUser: { user: { id: 'user-1' } } }
    mocks.fixtureDAO.getDataByPath.mockResolvedValue(fixture(false))
    mocks.loadQuizSession.mockResolvedValue(session())

    const wrapper = await mountSetup()
    await wrapper.get('input[aria-label="Quiz PDF password"]').setValue('secret')
    await acquireButton(wrapper).trigger('click')
    await flushPromises()

    expect(mocks.axiosPost).toHaveBeenCalled()
    expect(wrapper.emitted('resume')).toBeTruthy()
  })
})
