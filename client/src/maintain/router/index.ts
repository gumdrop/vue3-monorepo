import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory('/maintain/'),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('../views/HomeView.vue')
    },
    {
      path: '/season',
      name: 'season',
      component: () => import('../views/season/SeasonList.vue')
    },
    {
        path: '/season/:id',
        name: 'season-edit',
        component: () => import('../views/season/SeasonEdit.vue')
    },
    {
        path: '/season/:seasonId/competition/:id',
        name: 'competition-edit',
        component: () => import('../views/season/CompetitionEdit.vue')
    },
    {
        path: '/season/:seasonId/competition/:competitionId/fixtures/:id',
        name: 'fixtures-edit',
        component: () => import('../views/season/FixturesEdit.vue')
    },
    {
        path: '/season/:seasonId/competition/:competitionId/leaguetable/:id',
        name: 'leaguetable-edit',
        component: () => import('../views/season/LeagueTableEdit.vue')
    },
    {
      path: '/team',
      name: 'team',
      component: () => import('../views/team/TeamList.vue')
    },
    {
        path: '/team/:id',
        name: 'team-edit',
        component: () => import('../views/team/TeamEdit.vue')
    },
    {
      path: '/venue',
      name: 'venue',
      component: () => import('../views/venue/VenueList.vue')
    },
    {
        path: '/venue/:id',
        name: 'venue-edit',
        component: () => import('../views/venue/VenueEdit.vue')
    },
    {
      path: '/user',
      name: 'user',
      component: () => import('../views/user/UserList.vue')
    },
    {
        path: '/user/:id',
        name: 'user-edit',
        component: () => import('../views/user/UserEdit.vue')
    },
    {
      path: '/siteuser',
      name: 'siteuser',
      component: () => import('../views/siteuser/SiteUserList.vue')
    },
    {
        path: '/siteuser/:id',
        name: 'siteuser-edit',
        component: () => import('../views/siteuser/SiteUserEdit.vue')
    },
    {
      path: '/globaltext',
      name: 'globaltext',
      component: () => import('../views/globaltext/GlobalTextList.vue')
    },
    {
        path: '/globaltext/:id',
        name: 'globaltext-edit',
        component: () => import('../views/globaltext/GlobalTextEdit.vue')
    },
    {
      path: '/applicationcontext',
      name: 'applicationcontext',
      component: () => import('../views/applicationcontext/ApplicationContextEdit.vue')
    }
  ]
})

export default router
