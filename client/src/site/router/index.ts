import ContactUsTitle from '../components/other/ContactUsTitle.vue'
import HelpMenu from '../components/other/HelpMenu.vue'
import HelpTitle from '../components/other/HelpTitle.vue'
import LinksTitle from '../components/other/LinksTitle.vue'
import useAuth from '@/services/AuthService'
import { createRouter, createWebHistory } from 'vue-router'

// const { user } = useUserStore()

const { authGuard } = useAuth()

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior() {
    return { top: 0 }
  },
  routes: [
    {
      path: '/competition',
      children: [
        {
          path: '',
          name: 'competitions',
          components: {
            title: () => import('../components/competition/CompetitionsTitle.vue'),
            sidenav: () => import('../components/competition/CompetitionsMenu.vue'),
            default: () => import('../components/competition/CompetitionsMain.vue'),
          },
        },
        {
          path: 'rollofhonour/:id',
          name: 'competition roll of honour',
          props: {
            default: true,
            title: true,
          },
          components: {
            title: () =>
              import('../components/competition/statistics/CompetitionStatisticsTitle.vue'),
            default: () =>
              import('../components/competition/statistics/CompetitionStatisticsPage.vue'),
            sidenav: () => import('../components/competition/CompetitionsMenu.vue'),
          },
        },
        {
          path: ':path/league',
          name: 'league competition',
          props: true,
          components: {
            title: () => import('../components/competition/CompetitionTitle.vue'),
            default: () => import('../components/competition/LeagueCompetiton.vue'),
            sidenav: () => import('../components/competition/CompetitionsMenu.vue'),
          },
        },
        {
          path: ':path/cup',
          name: 'cup competition',
          props: true,
          components: {
            title: () => import('../components/competition/CompetitionTitle.vue'),
            default: () => import('../components/competition/CupCompetiton.vue'),
            sidenav: () => import('../components/competition/CompetitionsMenu.vue'),
          },
        },
        {
          path: ':path/singleton',
          name: 'singleton competition',
          props: true,
          components: {
            title: () => import('../components/competition/CompetitionTitle.vue'),
            default: () => import('../components/competition/SingletonCompetition.vue'),
            sidenav: () => import('../components/competition/CompetitionsMenu.vue'),
          },
        },
        {
          path: ':path/subsidiary',
          name: 'subsidiary competition',
          props: true,
          components: {
            title: () => import('../components/competition/CompetitionTitle.vue'),
            default: () => import('../components/competition/SubsidiaryCompetition.vue'),
            sidenav: () => import('../components/competition/CompetitionsMenu.vue'),
          },
        },
      ],
    },

    {
      path: '/fixtures/all',
      name: 'all fixtures',
      components: {
        default: () => import('../components/fixtures/AllFixturesPage.vue'),
        title: () => import('../components/fixtures/AllFixturesTitle.vue'),
        sidenav: () => import('../components/results/ResultsMenu.vue'),
      },
    },

    {
      path: '/results',
      name: 'results',
      children: [
        {
          path: 'all',
          components: {
            default: () => import('../components/results/AllResults.vue'),
            title: () => import('../components/results/ResultsTitle.vue'),
            sidenav: () => import('../components/results/ResultsMenu.vue'),
          },
        },
        {
          path: 'questions',
          name: 'questions',
          components: {
            default: () => import('../components/results/QuestionsPage.vue'),
            title: () => import('../components/results/QuestionsTitle.vue'),
            sidenav: () => import('../components/results/ResultsMenu.vue'),
          },
        },
        {
          path: 'submit/instructions',
          name: 'submit instructions',
          components: {
            default: () => import('../components/results/SubmitResultsInstructions.vue'),
            title: () => import('../components/results/SubmitResultsTitle.vue'),
            sidenav: () => import('../components/results/ResultsMenu.vue'),
          },
        },
        {
          path: 'submit',
          name: 'submit results',
          components: {
            default: () => import('../components/results/SubmitResults.vue'),
            title: () => import('../components/results/SubmitResultsTitle.vue'),
            sidenav: () => import('../components/results/ResultsMenu.vue'),
          },
          beforeEnter: authGuard,
        },
        {
          path: 'roundups',
          name: 'roundups',
          components: {
            default: () => import('../components/results/RoundupsPage.vue'),
            title: () => import('../components/results/ResultsTitle.vue'),
            sidenav: () => import('../components/results/ResultsMenu.vue'),
          },
        },
      ],
      redirect: '/results/all',
    },

    {
      path: '/team',
      children: [
        {
          path: '',
          name: 'teams',
          components: {
            default: () => import('../components/team/TeamsMain.vue'),
            title: () => import('../components/team/TeamsTitle.vue'),
            sidenav: () => import('../components/team/TeamsMenu.vue'),
          },
        },
        {
          path: ':id',
          name: 'team',
          components: {
            default: () => import('../components/team/TeamMain.vue'),
            title: () => import('../components/team/TeamTitle.vue'),
            sidenav: () => import('../components/team/TeamsMenu.vue'),
          },
          props: true,
        },
        {
          path: ':id/stats',
          name: 'team stats',
          components: {
            default: () => import('../components/team/stats/TeamStats.vue'),
            title: () => import('../components/team/stats/StatisticsTeamTitle.vue'),
            sidenav: () => import('../components/team/TeamsMenu.vue'),
          },
          props: true,
        },
        {
          path: 'start',
          name: 'team start',
          components: {
            default: () => import('../components/team/StartTeam.vue'),
            title: () => import('../components/team/StartTeamTitle.vue'),
            sidenav: () => import('../components/team/TeamsMenu.vue'),
          },
        },
        {
          path: 'edit',
          name: 'team edit',
          components: {
            default: () => import('../components/team/TeamEdit.vue'),
            title: () => import('../components/team/TeamEditTitle.vue'),
            sidenav: () => import('../components/team/TeamsMenu.vue'),
          },
          beforeEnter: authGuard,
        },
      ],
    },
    {
      path: '/venue',
      children: [
        {
          path: '',
          name: 'venues',
          components: {
            title: () => import('../components/venue/VenuesTitle.vue'),
            default: () => import('../components/venue/VenuesMain.vue'),
            sidenav: () => import('../components/venue/VenuesMenu.vue'),
          },
        },
        {
          path: ':id',
          name: 'venue',
          props: true,
          components: {
            title: () => import('../components/venue/VenueTitle.vue'),
            sidenav: () => import('../components/venue/VenuesMenu.vue'),
            default: () => import('../components/venue/VenueMain.vue'),
          },
        },
      ],
    },

    {
      path: '/analytics',
      name: 'analytics',
      components: {
        title: () => import('../components/analytics/AnalyticsTitle.vue'),
        default: () => import('../components/analytics/AnalyticsMain.vue'),
        sidenav: () => import('../components/analytics/AnalyticsMenu.vue'),
      },
    },
    {
      path: '/analytics/replay',
      name: 'analytics replay',
      components: {
        title: () => import('../components/analytics/AnalyticsTitle.vue'),
        default: () => import('../components/analytics/AnalyticsReplay.vue'),
        sidenav: () => import('../components/analytics/AnalyticsMenu.vue'),
      },
    },
    {
      path: '/analytics/all-seasons',
      name: 'analytics all seasons',
      components: {
        title: () => import('../components/analytics/AnalyticsTitle.vue'),
        default: () => import('../components/analytics/AnalyticsAllSeasons.vue'),
        sidenav: () => import('../components/analytics/AnalyticsMenu.vue'),
      },
    },
    {
      path: '/rules',
      name: 'rules',
      components: {
        title: () => import('../components/other/RulesTitle.vue'),
        default: () => import('../components/other/RulesMain.vue'),
      },
    },
    {
      path: '/links',
      name: 'links',
      components: {
        title: LinksTitle,
        default: () => import('../components/other/LinksMain.vue'),
      },
    },
    {
      path: '/contact',
      name: 'contact',
      components: {
        title: ContactUsTitle,
        default: () => import('../components/other/ContactUsMain.vue'),
      },
    },
    {
      path: '/help',
      name: 'help',
      components: {
        title: HelpTitle,
        default: () => import('../components/other/HelpMain.vue'),
        sidenav: HelpMenu,
      },
    },
    {
      path: '/login',
      name: 'login',
      components: {
        title: () => import('../components/auth/LoginTitle.vue'),
        default: () => import('../components/auth/LoginMain.vue'),
      },
      // beforeEnter: unauthGuard,
    },

    {
      path: '/home',
      name: 'home',
      components: {
        title: () => import('../components/home/HomeTitle.vue'),
        default: () => import('../components/home/HomeMain.vue'),
      },
    },
    {
      path: '',
      redirect: '/home',
    },
  ],
})

export default router
