import { createRouter, createWebHashHistory, createWebHistory } from 'vue-router'
import { getCurrentUser } from 'vuefire'

const maintenanceBasePath = '/maintain/'

const localHostnames = new Set(['localhost', '127.0.0.1', '::1', '[::1]'])

export const isLocalMaintenanceHost = (
  hostname = typeof window === 'undefined' ? '' : window.location.hostname,
  isDev = import.meta.env.DEV,
) => {
  return isDev || localHostnames.has(hostname)
}

export const createMaintenanceHistory = () => {
  return isLocalMaintenanceHost()
    ? createWebHashHistory(maintenanceBasePath)
    : createWebHistory(maintenanceBasePath)
}

export const currentMaintenancePath = (
  location: Pick<Location, 'pathname' | 'search' | 'hash'> = window.location,
) => `${location.pathname}${location.search}${location.hash}`

export const loginRedirectUrl = (forwardPath = currentMaintenancePath()) => {
  const search = new URLSearchParams({ forward: forwardPath })
  return `/login?${search.toString()}`
}

export const isMaintenanceAuthBypassEnabled = (
  hostname = typeof window === 'undefined' ? '' : window.location.hostname,
) => {
  return (
    import.meta.env.VITE_MAINTAIN_AUTH_BYPASS === 'true' && isLocalMaintenanceHost(hostname, false)
  )
}

export const requireAuthenticatedUser = async (
  redirect: (url: string) => void = (url) => window.location.assign(url),
) => {
  if (isMaintenanceAuthBypassEnabled()) return true

  const user = await getCurrentUser()
  if (user) return true

  redirect(loginRedirectUrl())
  return false
}

const router = createRouter({
  history: createMaintenanceHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('../views/HomeView.vue'),
    },
    {
      path: '/season',
      name: 'season',
      component: () => import('../views/season/SeasonList.vue'),
    },
    {
      path: '/season/:id',
      name: 'season-edit',
      component: () => import('../views/season/SeasonEdit.vue'),
    },
    {
      path: '/season/:seasonId/competition/:id',
      name: 'competition-edit',
      component: () => import('../views/season/CompetitionEdit.vue'),
    },
    {
      path: '/season/:seasonId/competition/:competitionId/fixtures/:id',
      name: 'fixtures-edit',
      component: () => import('../views/season/FixturesEdit.vue'),
    },
    {
      path: '/season/:seasonId/competition/:competitionId/leaguetable/:id',
      name: 'leaguetable-edit',
      component: () => import('../views/season/LeagueTableEdit.vue'),
    },
    {
      path: '/team',
      name: 'team',
      component: () => import('../views/team/TeamList.vue'),
    },
    {
      path: '/team/:id',
      name: 'team-edit',
      component: () => import('../views/team/TeamEdit.vue'),
    },
    {
      path: '/venue',
      name: 'venue',
      component: () => import('../views/venue/VenueList.vue'),
    },
    {
      path: '/venue/:id',
      name: 'venue-edit',
      component: () => import('../views/venue/VenueEdit.vue'),
    },
    {
      path: '/user',
      name: 'user',
      component: () => import('../views/user/UserList.vue'),
    },
    {
      path: '/user/:id',
      name: 'user-edit',
      component: () => import('../views/user/UserEdit.vue'),
    },
    {
      path: '/siteuser',
      name: 'siteuser',
      component: () => import('../views/siteuser/SiteUserList.vue'),
    },
    {
      path: '/siteuser/:id',
      name: 'siteuser-edit',
      component: () => import('../views/siteuser/SiteUserEdit.vue'),
    },
    {
      path: '/globaltext',
      name: 'globaltext',
      component: () => import('../views/globaltext/GlobalTextList.vue'),
    },
    {
      path: '/globaltext/:id',
      name: 'globaltext-edit',
      component: () => import('../views/globaltext/GlobalTextEdit.vue'),
    },
    {
      path: '/competitionstatistics',
      name: 'competitionstatistics',
      component: () => import('../views/competitionstatistics/CompetitionStatisticsList.vue'),
    },
    {
      path: '/competitionstatistics/:id',
      name: 'competitionstatistics-edit',
      component: () => import('../views/competitionstatistics/CompetitionStatisticsEdit.vue'),
    },
    {
      path: '/statistics',
      name: 'statistics',
      component: () => import('../views/statistics/StatisticsRecalculate.vue'),
    },
    {
      path: '/applicationcontext',
      name: 'applicationcontext',
      component: () => import('../views/applicationcontext/ApplicationContextEdit.vue'),
    },
  ],
})

router.beforeEach(() => requireAuthenticatedUser())

export default router
