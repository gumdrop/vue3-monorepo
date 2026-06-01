import { flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  appContextRef: { path: 'applicationcontext/default' },
  getDoc: vi.fn(),
  onAuthStateChanged: vi.fn(),
  siteUserForUid: vi.fn(),
  teamForUser: vi.fn(),
  useFirebaseAuth: vi.fn(),
}))

vi.mock('@/dao/ApplicationContextDAO', () => ({
  default: {
    get: vi.fn(() => mocks.appContextRef),
  },
}))

vi.mock('@/dao/SiteUserDAO', () => ({
  default: {
    siteUserForUid: mocks.siteUserForUid,
  },
}))

vi.mock('@/services/TeamService', () => ({
  useTeams: () => ({
    teamForUser: mocks.teamForUser,
  }),
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

import { useAppContextStore, useSideMenuStore, useUserStore } from '../app'
import { useCompetition } from '../competiton'
import { useResultsStore } from '../results'
import { useTeamStore } from '../teams'

const appContext = {
  id: 'default',
  path: 'applicationcontext/default',
  currentSeason: { id: 'season-2026', path: 'season/season-2026' },
}

const snapshot = (data: unknown) => ({
  data: () => data,
})

const unrefMaybe = (value: unknown): unknown =>
  value && typeof value === 'object' && 'value' in value
    ? unrefMaybe((value as { value: unknown }).value)
    : value

describe('stores', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setActivePinia(createPinia())
    mocks.getDoc.mockResolvedValue(snapshot(appContext))
    mocks.useFirebaseAuth.mockReturnValue({ name: 'auth' })
  })

  it('toggles the side menu flag', () => {
    const store = useSideMenuStore()

    expect(store.sidemenu).toBe(true)
    store.setSidemenu(false)

    expect(store.sidemenu).toBe(false)
  })

  it('exports a default Pinia instance', async () => {
    const pinia = (await import('../index')).default

    expect(pinia.install).toEqual(expect.any(Function))
  })

  it('loads app context and default season into season-backed stores', async () => {
    const app = useAppContextStore()
    const competition = useCompetition()
    const results = useResultsStore()
    const teams = useTeamStore()

    await flushPromises()

    expect(mocks.getDoc).toHaveBeenCalledWith(mocks.appContextRef)
    expect(unrefMaybe(app.appContext)).toEqual(appContext)
    expect(unrefMaybe(app.seasonId)).toBe('season-2026')
    expect(unrefMaybe(competition.seasonId)).toBe('season-2026')
    expect(unrefMaybe(results.seasonId)).toBe('season-2026')
    expect(unrefMaybe(teams.seasonId)).toBe('season-2026')

    competition.setSeason('season-2027')
    results.setSeason('season-2027')
    teams.setSeason('season-2027')

    expect(unrefMaybe(competition.seasonId)).toBe('season-2027')
    expect(unrefMaybe(results.seasonId)).toBe('season-2027')
    expect(unrefMaybe(teams.seasonId)).toBe('season-2027')
  })

  it('sets and clears the logged-in user projection', async () => {
    const siteUser = {
      id: 'site-user-1',
      path: 'siteuser/site-user-1',
      user: { id: 'user-1', path: 'user/user-1' },
    }
    const team = { id: 'alpha', path: 'team/alpha', name: 'Alpha' }
    mocks.siteUserForUid.mockResolvedValue(siteUser)
    mocks.teamForUser.mockResolvedValue(team)

    const store = useUserStore()
    await store.setUser({
      uid: 'firebase-user-1',
      email: 'alpha@example.com',
    } as never)

    expect(mocks.onAuthStateChanged).toHaveBeenCalledWith({ name: 'auth' }, expect.any(Function))
    expect(store.user).toEqual({
      siteUser,
      team,
      email: 'alpha@example.com',
    })

    await store.setUser(null)

    expect(store.user).toBeUndefined()
  })
})
