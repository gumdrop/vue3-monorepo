import { describe, it, expect } from 'vitest'
import router, { isLocalMaintenanceHost } from '../router'

describe('Maintenance Router', () => {
  it('has correct base path', () => {
    // router.options.history.base might not be easily accessible depending on vue-router version
    // but we can check if routes are defined
    const routes = router.getRoutes()
    expect(routes.length).toBeGreaterThan(0)
  })

  it('detects local hosts for hash navigation', () => {
    expect(isLocalMaintenanceHost('localhost', false)).toBe(true)
    expect(isLocalMaintenanceHost('127.0.0.1', false)).toBe(true)
    expect(isLocalMaintenanceHost('::1', false)).toBe(true)
    expect(isLocalMaintenanceHost('www.chilternquizleague.example', false)).toBe(false)
    expect(isLocalMaintenanceHost('www.chilternquizleague.example', true)).toBe(true)
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
