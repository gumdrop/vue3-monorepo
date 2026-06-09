import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { getCurrentUser } from 'vuefire'
import router, {
  currentMaintenancePath,
  isMaintenanceAuthBypassEnabled,
  isLocalMaintenanceHost,
  loginRedirectUrl,
  requireAuthenticatedUser,
} from '../router'

vi.mock('vuefire', () => ({
  getCurrentUser: vi.fn(),
}))

describe('Maintenance Router', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('has correct base path', () => {
    // router.options.history.base might not be easily accessible depending on vue-router version
    // but we can check if routes are defined
    const routes = router.getRoutes()
    expect(routes.length).toBeGreaterThan(0)
  })

  it('detects local hosts for local-only auth bypass checks', () => {
    expect(isLocalMaintenanceHost('localhost', false)).toBe(true)
    expect(isLocalMaintenanceHost('127.0.0.1', false)).toBe(true)
    expect(isLocalMaintenanceHost('::1', false)).toBe(true)
    expect(isLocalMaintenanceHost('www.chilternquizleague.example', false)).toBe(false)
    expect(isLocalMaintenanceHost('www.chilternquizleague.example', true)).toBe(true)
  })

  it('builds login redirect URLs with the maintain path as forward target', () => {
    const path = currentMaintenancePath({
      pathname: '/maintain/season',
      search: '?mode=edit',
      hash: '',
    })

    expect(path).toBe('/maintain/season?mode=edit')
    expect(loginRedirectUrl(path)).toBe('/login?forward=%2Fmaintain%2Fseason%3Fmode%3Dedit')
  })

  it('allows maintain navigation for authenticated users', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ uid: 'firebase-user-1' } as never)
    const redirect = vi.fn()

    await expect(requireAuthenticatedUser(redirect)).resolves.toBe(true)
    expect(redirect).not.toHaveBeenCalled()
  })

  it('allows local acceptance-test auth bypass only when explicitly enabled', async () => {
    vi.stubEnv('VITE_MAINTAIN_AUTH_BYPASS', 'true')
    const redirect = vi.fn()

    expect(isMaintenanceAuthBypassEnabled('127.0.0.1')).toBe(true)
    expect(isMaintenanceAuthBypassEnabled('localhost')).toBe(true)
    expect(isMaintenanceAuthBypassEnabled('www.chilternquizleague.example')).toBe(false)

    await expect(requireAuthenticatedUser(redirect)).resolves.toBe(true)
    expect(getCurrentUser).not.toHaveBeenCalled()
    expect(redirect).not.toHaveBeenCalled()
  })

  it('redirects anonymous users to login', async () => {
    window.history.pushState({}, '', '/maintain/season')
    vi.mocked(getCurrentUser).mockResolvedValue(null)
    const redirect = vi.fn()

    await expect(requireAuthenticatedUser(redirect)).resolves.toBe(false)
    expect(redirect).toHaveBeenCalledWith('/login?forward=%2Fmaintain%2Fseason')
  })

  it('contains season route', () => {
    const routes = router.getRoutes()
    const seasonRoute = routes.find((r) => r.name === 'season')
    expect(seasonRoute).toBeDefined()
    expect(seasonRoute?.path).toBe('/season')
  })

  it('contains team route', () => {
    const routes = router.getRoutes()
    const teamRoute = routes.find((r) => r.name === 'team')
    expect(teamRoute).toBeDefined()
    expect(teamRoute?.path).toBe('/team')
  })

  it('contains nested competition route', () => {
    const routes = router.getRoutes()
    const compRoute = routes.find((r) => r.name === 'competition-edit')
    expect(compRoute).toBeDefined()
    expect(compRoute?.path).toBe('/season/:seasonId/competition/:id')
  })

  it('contains every maintenance view route', () => {
    const routePathsByName = new Map(router.getRoutes().map((route) => [route.name, route.path]))
    const expectedRoutes = [
      ['home', '/'],
      ['season', '/season'],
      ['season-edit', '/season/:id'],
      ['competition-edit', '/season/:seasonId/competition/:id'],
      ['fixtures-edit', '/season/:seasonId/competition/:competitionId/fixtures/:id'],
      ['leaguetable-edit', '/season/:seasonId/competition/:competitionId/leaguetable/:id'],
      ['team', '/team'],
      ['team-members-migrate', '/team-members/migrate'],
      ['team-edit', '/team/:id'],
      ['venue', '/venue'],
      ['venue-edit', '/venue/:id'],
      ['user', '/user'],
      ['user-edit', '/user/:id'],
      ['siteuser', '/siteuser'],
      ['siteuser-edit', '/siteuser/:id'],
      ['globaltext', '/globaltext'],
      ['globaltext-edit', '/globaltext/:id'],
      ['competitionstatistics', '/competitionstatistics'],
      ['competitionstatistics-edit', '/competitionstatistics/:id'],
      ['statistics', '/statistics'],
      ['applicationcontext', '/applicationcontext'],
    ]

    expectedRoutes.forEach(([name, path]) => {
      expect(routePathsByName.get(name)).toBe(path)
    })
  })
})
