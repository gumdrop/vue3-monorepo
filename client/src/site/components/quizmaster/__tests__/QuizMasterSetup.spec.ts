import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { computed, defineComponent, h, nextTick } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useQuizmasterStore } from '@/stores/quizmaster'
import { siteComponentStubs } from '../../__tests__/componentStubs'
import QuizMasterSetup from '../QuizMasterSetup.vue'

const mocks = vi.hoisted(() => ({
  user: undefined as { team?: { id: string }; siteUser?: { user?: { id?: string } } } | undefined,
  fixturesForResultSubmission: vi.fn(),
  fixtureDAO: { getDataByPath: vi.fn() },
  fixturesDAO: { getDataByPath: vi.fn() },
  competitionDAO: { getDataByPath: vi.fn() },
  teamDAO: { getDataById: vi.fn() },
  teamMemberDAO: { getDataForTeam: vi.fn(), saveForTeam: vi.fn() },
  userDAO: { getDataById: vi.fn(), newInstance: vi.fn(), save: vi.fn() },
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

vi.mock('@/dao/CompetitionDAO', () => ({ default: mocks.competitionDAO }))

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
  props: { label: String, modelValue: [String, Array, Number], items: Array },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    return () =>
      h('input', {
        'aria-label': String(props.label),
        'data-items': JSON.stringify(props.items ?? []),
        value: props.modelValue ?? '',
        onInput: (event: Event) =>
          emit('update:modelValue', (event.target as HTMLInputElement).value),
      })
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
  spareCursor: 0,
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
    mocks.competitionDAO.getDataByPath.mockResolvedValue({ _name: 'cup' })
    mocks.teamDAO.getDataById.mockImplementation(async (id: string) => ({
      name: id === 'home-team' ? 'Home Team' : 'Away Team',
    }))
    mocks.teamMemberDAO.getDataForTeam.mockResolvedValue({ users: [] })
    mocks.teamMemberDAO.saveForTeam.mockResolvedValue(undefined)
    mocks.userDAO.getDataById.mockResolvedValue(undefined)
    mocks.userDAO.save.mockResolvedValue(undefined)
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

  it('does not offer retired team members when selecting players', async () => {
    mocks.fixtureDAO.getDataByPath.mockResolvedValue(fixture(false))
    mocks.teamMemberDAO.getDataForTeam.mockImplementation(async (teamPath: string) =>
      teamPath === 'team/home-team'
        ? {
            users: [
              { id: 'active', path: 'user/active' },
              { id: 'retired', path: 'user/retired' },
            ],
          }
        : { users: [] },
    )
    mocks.userDAO.getDataById.mockImplementation(async (id: string) => {
      if (id === 'active') {
        return {
          id,
          path: 'user/active',
          name: 'Active Alice',
          email: 'alice@example.com',
          retired: false,
        }
      }
      if (id === 'retired') {
        return {
          id,
          path: 'user/retired',
          name: 'Retired Bob',
          email: 'bob@example.com',
          retired: true,
        }
      }
      return undefined
    })

    const wrapper = await mountSetup()
    useQuizmasterStore().quiz = quizPaper()
    await nextTick()

    const homePlayerItems = wrapper
      .findAll('input[aria-label="Player 1"]')[0]
      .attributes('data-items')
    expect(homePlayerItems).toContain('Active Alice')
    expect(homePlayerItems).not.toContain('Retired Bob')
  })

  it('notifies and restores an in-progress quiz for re-acquire', async () => {
    mocks.user = { team: { id: 'team-1' } }
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
    mocks.user = { team: { id: 'team-1' } }
    mocks.fixtureDAO.getDataByPath.mockResolvedValue(fixture(false))
    mocks.loadQuizSession.mockResolvedValue(session())

    const wrapper = await mountSetup()
    await wrapper.get('input[aria-label="Quiz PDF password"]').setValue('secret')
    await acquireButton(wrapper).trigger('click')
    await flushPromises()

    expect(mocks.axiosPost).toHaveBeenCalled()
    expect(wrapper.emitted('resume')).toBeTruthy()
  })

  it('saves adhoc players as new users and adds them to their team member collections', async () => {
    let nextUserId = 0
    mocks.userDAO.newInstance.mockImplementation(() => {
      nextUserId += 1
      return {
        id: `adhoc-${nextUserId}`,
        path: `user/adhoc-${nextUserId}`,
        name: '',
        email: '',
        retired: false,
        placeholder: false,
      }
    })
    mocks.teamMemberDAO.getDataForTeam.mockImplementation(async (teamPath: string) =>
      teamPath === 'team/home-team'
        ? { users: [{ id: 'existing-home', path: 'user/existing-home' }] }
        : { users: [] },
    )
    mocks.userDAO.getDataById.mockImplementation(async (id: string) =>
      id === 'existing-home'
        ? {
            id,
            path: `user/${id}`,
            name: 'Existing Home',
            email: 'existing@example.com',
            retired: false,
          }
        : undefined,
    )

    mocks.fixtureDAO.getDataByPath.mockResolvedValue(fixture(false))
    const wrapper = await mountSetup()
    useQuizmasterStore().quiz = quizPaper()
    await nextTick()

    const playerInputs = wrapper.findAll('input[aria-label^="Player"]')
    await playerInputs[0].setValue('Existing Home')
    await playerInputs[1].setValue('New Home Player')
    await playerInputs[2].setValue('Another New Home')
    await playerInputs[4].setValue('New Away Player')
    await playerInputs[5].setValue('Second Away Player')
    await playerInputs[6].setValue('Third Away Player')

    const reviewButton = wrapper
      .findAll('button')
      .find((candidate) => candidate.text().includes('Review questions'))
    expect(reviewButton, 'Review questions button').toBeDefined()
    await reviewButton!.trigger('click')
    await flushPromises()

    expect(mocks.userDAO.save).toHaveBeenCalledTimes(5)
    expect(mocks.userDAO.save).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'New Home Player',
        email: 'placeholder@dummy.com',
        placeholder: true,
      }),
    )
    expect(mocks.userDAO.save).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Another New Home',
        email: 'placeholder@dummy.com',
        placeholder: true,
      }),
    )
    expect(mocks.userDAO.save).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'New Away Player',
        email: 'placeholder@dummy.com',
        placeholder: true,
      }),
    )
    expect(mocks.userDAO.save).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Second Away Player',
        email: 'placeholder@dummy.com',
        placeholder: true,
      }),
    )
    expect(mocks.userDAO.save).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Third Away Player',
        email: 'placeholder@dummy.com',
        placeholder: true,
      }),
    )

    expect(mocks.teamMemberDAO.saveForTeam).toHaveBeenCalledTimes(2)
    expect(mocks.teamMemberDAO.saveForTeam).toHaveBeenCalledWith('team/home-team', [
      { id: 'existing-home', path: 'user/existing-home' },
      { id: 'adhoc-1', path: 'user/adhoc-1' },
      { id: 'adhoc-2', path: 'user/adhoc-2' },
    ])
    expect(mocks.teamMemberDAO.saveForTeam).toHaveBeenCalledWith('team/away-team', [
      { id: 'adhoc-3', path: 'user/adhoc-3' },
      { id: 'adhoc-4', path: 'user/adhoc-4' },
      { id: 'adhoc-5', path: 'user/adhoc-5' },
    ])
  })
})
