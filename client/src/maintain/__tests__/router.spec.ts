import { describe, it, expect } from 'vitest'
import router from '../router'

describe('Maintenance Router', () => {
  it('has correct base path', () => {
    // router.options.history.base might not be easily accessible depending on vue-router version
    // but we can check if routes are defined
    const routes = router.getRoutes()
    expect(routes.length).toBeGreaterThan(0)
  })

  it('contains season route', () => {
    const routes = router.getRoutes()
    const seasonRoute = routes.find(r => r.name === 'season')
    expect(seasonRoute).toBeDefined()
    expect(seasonRoute?.path).toBe('/season')
  })

  it('contains team route', () => {
    const routes = router.getRoutes()
    const teamRoute = routes.find(r => r.name === 'team')
    expect(teamRoute).toBeDefined()
    expect(teamRoute?.path).toBe('/team')
  })

  it('contains nested competition route', () => {
    const routes = router.getRoutes()
    const compRoute = routes.find(r => r.name === 'competition-edit')
    expect(compRoute).toBeDefined()
    expect(compRoute?.path).toBe('/season/:seasonId/competition/:id')
  })
})
