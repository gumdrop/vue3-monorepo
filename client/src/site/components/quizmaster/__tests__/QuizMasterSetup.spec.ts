import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { computed } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useQuizmasterStore } from '@/stores/quizmaster'
import { siteComponentStubs } from '../../__tests__/componentStubs'
import QuizMasterSetup from '../QuizMasterSetup.vue'

const mocks = vi.hoisted(() => ({
  user: undefined as { team?: { id: string } } | undefined,
  fixturesForResultSubmission: vi.fn(),
  fixtureDAO: { getDataByPath: vi.fn() },
  fixturesDAO: { getDataByPath: vi.fn() },
  teamDAO: { getDataById: vi.fn() },
  teamMemberDAO: { getDataForTeam: vi.fn() },
  userDAO: { getDataById: vi.fn() },
  date: vi.fn((value: string) => value),
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

const FIXTURE_PATH = 'season/season-1/competition/cup/fixtures/set-1/fixture/f-1'

const fixture = (withResult: boolean) => ({
  id: 'f-1',
  path: FIXTURE_PATH,
  home: { id: 'home-team', path: 'team/home-team' },
  away: { id: 'away-team', path: 'team/away-team' },
  ...(withResult ? { result: { homeScore: 10, awayScore: 8 } } : {}),
})

const mountSetup = async (): Promise<VueWrapper> => {
  const wrapper = mount(QuizMasterSetup, {
    global: { stubs: siteComponentStubs },
  })
  await flushPromises()
  return wrapper
}

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
})
