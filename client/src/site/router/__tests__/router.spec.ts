import { describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  authGuard: vi.fn(),
}))

vi.mock('@/services/AuthService', () => ({
  default: () => ({
    authGuard: mocks.authGuard,
  }),
}))

import router from '../index'

describe('site router', () => {
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
    expect(routePathsByName.get('login')).toBe('/login')
    expect(router.options.scrollBehavior?.({} as never, {} as never, null)).toEqual({ top: 0 })
  })

  it('keeps protected entry points behind the auth guard', () => {
    const routeGuardsByName = new Map(
      router.getRoutes().map((route) => [route.name, route.beforeEnter]),
    )

    expect(routeGuardsByName.get('submit results')).toBe(mocks.authGuard)
    expect(routeGuardsByName.get('team edit')).toBe(mocks.authGuard)
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
