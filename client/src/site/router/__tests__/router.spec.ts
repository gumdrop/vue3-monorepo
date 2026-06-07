import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  authGuard: vi.fn(),
  userStore: {
    user: undefined as undefined | { team?: { id?: string } },
  },
}))

vi.mock('@/services/AuthService', () => ({
  default: () => ({
    authGuard: mocks.authGuard,
  }),
}))

vi.mock('@/stores/app', () => ({
  useUserStore: () => mocks.userStore,
}))

import router, { redirectLoggedInUserToTeam } from '../index'

describe('site router', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.userStore.user = undefined
  })

  it('registers public top-level routes and scrolls to the top', () => {
    const routes = router.getRoutes()
    const routePathsByName = new Map(routes.map((route) => [route.name, route.path]))

    expect(routePathsByName.get('home')).toBe('/home')
    expect(routePathsByName.get('competitions')).toBe('/competition')
    expect(routePathsByName.get('teams')).toBe('/team')
    expect(routePathsByName.get('venues')).toBe('/venue')
    expect(routePathsByName.get('rules')).toBe('/rules')
    expect(routePathsByName.get('links')).toBe('/links')
    expect(routePathsByName.get('contact')).toBe('/contact')
    expect(routePathsByName.get('help')).toBe('/help')
    expect(routePathsByName.get('analytics')).toBe('/analytics')
    expect(routePathsByName.get('analytics replay')).toBe('/analytics/replay')
    expect(routePathsByName.get('login')).toBe('/login')
    expect(routePathsByName.get('questions')).toBe('/results/questions')
    expect(router.options.scrollBehavior?.({} as never, {} as never, null)).toEqual({ top: 0 })
  })

  it('keeps protected entry points behind the auth guard', () => {
    const routeGuardsByName = new Map(
      router.getRoutes().map((route) => [route.name, route.beforeEnter]),
    )

    expect(routeGuardsByName.get('submit results')).toBe(mocks.authGuard)
    expect(routeGuardsByName.get('team edit')).toBe(mocks.authGuard)
  })

  it('redirects logged-in users from the team index to their team page', () => {
    const routeGuardsByName = new Map(
      router.getRoutes().map((route) => [route.name, route.beforeEnter]),
    )

    expect(routeGuardsByName.get('teams')).toBe(redirectLoggedInUserToTeam)
    expect(redirectLoggedInUserToTeam()).toBe(true)

    mocks.userStore.user = { team: { id: 'alpha' } }

    expect(redirectLoggedInUserToTeam()).toEqual({
      name: 'team',
      params: { id: 'alpha' },
    })
  })

  it('registers competition, team, and venue detail routes with props', () => {
    const routes = router.getRoutes()

    expect(routes.find((route) => route.name === 'league competition')).toMatchObject({
      path: '/competition/:path/league',
      props: { default: true },
    })
    expect(routes.find((route) => route.name === 'team')).toMatchObject({
      path: '/team/:id',
      props: { default: true, title: true, sidenav: true },
    })
    expect(routes.find((route) => route.name === 'venue')).toMatchObject({
      path: '/venue/:id',
      props: { default: true, title: true, sidenav: true },
    })
  })
})
