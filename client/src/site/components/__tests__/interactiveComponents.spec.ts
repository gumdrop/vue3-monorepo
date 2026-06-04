import { flushPromises, mount } from '@vue/test-utils'
import { useUserStore } from '@/stores/app'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick } from 'vue'
import App from '../App.vue'
import LoginMain from '../auth/LoginMain.vue'
import ProfileEdit from '../auth/ProfileEdit.vue'
import EventsTab from '../home/EventsTab.vue'
import LeagueTableRow from '../leaguetable/LeagueTableRow.vue'
import SeasonSelect from '../season/SeasonSelect.vue'
import { siteComponentStubs } from './componentStubs'

const mocks = vi.hoisted(() => ({
  logonWithGoogle: vi.fn(),
  routerPush: vi.fn(),
  route: {
    query: {} as Record<string, unknown>,
  },
  saveSiteUser: vi.fn(),
  seasons: [] as Array<{ id: string; startYear: number; endYear: number }>,
  setSidemenu: vi.fn(),
  standaloneEvents: vi.fn(),
  teams: new Map<string, unknown>(),
  user: undefined as
    | {
        siteUser: { id: string; path: string; handle: string; avatar: string }
        team: { id: string; name: string }
        email: string
      }
    | undefined,
  verifyEmail: vi.fn(),
}))

vi.mock('@/dao/SeasonDAO', () => ({
  default: {
    collection: () => ({
      __data: mocks.seasons,
    }),
  },
}))

vi.mock('@/dao/ApplicationContextDAO', () => ({
  default: {
    get: () => ({
      path: 'applicationcontext/site',
      __data: { id: 'site', leagueName: 'Quiz League' },
    }),
  },
}))

vi.mock('@/dao/SiteUserDAO', () => ({
  default: {
    save: mocks.saveSiteUser,
  },
}))

vi.mock('@/dao/TeamDAO', () => ({
  default: {
    getById: (id: string) => ({
      id,
      path: `team/${id}`,
      __data: mocks.teams.get(id),
    }),
  },
}))

vi.mock('@/services/AuthService', () => ({
  default: () => ({
    authGuard: vi.fn(),
    logonWithGoogle: mocks.logonWithGoogle,
    verifyEmail: mocks.verifyEmail,
  }),
}))

vi.mock('@/services/CalendarService', () => ({
  useCalendar: () => ({
    standaloneEvents: mocks.standaloneEvents,
  }),
}))

vi.mock('@/services/LayoutService', () => ({
  useLayout: () => ({
    gridSize: 'grid-test',
    layoutSize: 'layout-test',
  }),
}))

vi.mock('@/services/SeasonService', () => ({
  useSeason: () => ({
    formatSeason: (season: { startYear: number; endYear: number }) =>
      `${season.startYear}/${season.endYear}`,
  }),
}))

vi.mock('@/services/TitleService', () => ({
  default: () => ({
    setTitle: vi.fn(),
  }),
}))

vi.mock('@/stores/app', async () => {
  const { ref } = await import('vue')
  const userRef = ref<typeof mocks.user>()

  return {
    useSideMenuStore: () => ({
      sidemenu: true,
      setSidemenu: mocks.setSidemenu,
    }),
    useUserStore: () => {
      const store = {}
      Object.defineProperty(store, 'user', {
        get: () => userRef.value ?? mocks.user,
        set: (nextUser) => {
          userRef.value = nextUser as typeof mocks.user
          mocks.user = nextUser as typeof mocks.user
        },
      })
      return store
    },
  }
})

vi.mock('pinia', async () => {
  const { computed } = await import('vue')

  return {
    storeToRefs: (store: { user: unknown }) => ({
      user: computed({
        get: () => store.user,
        set: (nextUser) => {
          store.user = nextUser
        },
      }),
    }),
  }
})

vi.mock('vue-router', () => ({
  useRoute: () => mocks.route,
  useRouter: () => ({
    push: mocks.routerPush,
  }),
}))

vi.mock('vuetify', async () => {
  const { ref } = await import('vue')

  return {
    useDisplay: () => ({
      lgAndUp: ref(true),
      mdAndDown: ref(false),
      mdAndUp: ref(true),
      smAndDown: ref(false),
      smAndUp: ref(true),
    }),
    useGoTo: () => vi.fn(),
  }
})

vi.mock('vuefire', async () => {
  const { ref } = await import('vue')

  const resolve = (source: unknown) => {
    const resolved = typeof source === 'function' ? source() : source
    return (resolved as { __data?: unknown } | undefined)?.__data
  }

  return {
    useCollection: (source: unknown) => ref(resolve(source) ?? []),
    useDocument: (source: unknown) =>
      Object.assign(ref(resolve(source)), {
        error: undefined,
        pending: false,
      }),
  }
})

const qlNamedTextStub = defineComponent({
  props: {
    textName: String,
  },
  setup(props) {
    return () => h('span', { 'data-test': 'named-text' }, props.textName)
  },
})

const competitionLinkStub = defineComponent({
  props: {
    path: String,
  },
  setup(props) {
    return () => h('span', { 'data-test': 'competition-link' }, props.path)
  },
})

const venueLinkStub = defineComponent({
  props: {
    id: String,
  },
  setup(props) {
    return () => h('span', { 'data-test': 'venue-link' }, props.id)
  },
})

const passthroughStub = defineComponent({
  setup(_, { slots }) {
    return () => h('div', slots.default?.())
  },
})

const routerViewSlotStub = defineComponent({
  props: {
    name: String,
  },
  setup(_, { slots }) {
    const emptyRouteComponent = defineComponent({
      setup() {
        return () => null
      },
    })
    return () => h('div', slots.default?.({ Component: emptyRouteComponent }))
  },
})

const mountSite = (
  component: Parameters<typeof mount>[0],
  options: Parameters<typeof mount>[1] = {},
) =>
  mount(component, {
    ...options,
    global: {
      stubs: {
        ...siteComponentStubs,
        CompetitionLink: competitionLinkStub,
        QlNamedText: qlNamedTextStub,
        VenueLink: venueLinkStub,
      },
      mocks: {
        $route: mocks.route,
        $vuetify: {
          display: {
            smAndDown: false,
            smAndUp: true,
          },
        },
      },
      ...options.global,
    },
  })

const clickButton = async (wrapper: ReturnType<typeof mount>, text: string) => {
  const button = wrapper.findAll('button').find((candidate) => candidate.text().includes(text))
  expect(button, `button with text "${text}"`).toBeDefined()
  await button!.trigger('click')
}

beforeEach(() => {
  vi.clearAllMocks()
  mocks.route.query = {}
  mocks.saveSiteUser.mockResolvedValue(undefined)
  mocks.seasons = [
    { id: '2024-2025', startYear: 2024, endYear: 2025 },
    { id: '2025-2026', startYear: 2025, endYear: 2026 },
  ]
  mocks.standaloneEvents.mockResolvedValue([])
  mocks.teams.clear()
  mocks.user = {
    siteUser: {
      id: 'alice',
      path: 'siteuser/alice',
      handle: 'Alice',
      avatar: '/avatar.png',
    },
    team: {
      id: 'alpha',
      name: 'Alpha',
    },
    email: 'alice@example.com',
  }
  useUserStore().user = mocks.user
  mocks.logonWithGoogle.mockResolvedValue({ id: 'site-user-1', path: 'siteuser/site-user-1' })
  mocks.verifyEmail.mockResolvedValue({ id: 'site-user-1', path: 'siteuser/site-user-1' })
})

describe('interactive site components', () => {
  it('updates the app bar when the login store receives a user', async () => {
    const loggedInUser = mocks.user
    useUserStore().user = undefined
    const wrapper = mountSite(App, {
      global: {
        stubs: {
          ...siteComponentStubs,
          Notifications: true,
          PageTitle: true,
          RouterView: routerViewSlotStub,
          VBottomNavigation: true,
          VFadeTransition: passthroughStub,
          VToolbarItems: passthroughStub,
          'v-fade-transition': passthroughStub,
          FadeTransition: passthroughStub,
        },
      },
    })

    expect(wrapper.find('[data-image="/avatar.png"]').exists()).toBe(false)
    expect(wrapper.text()).toContain('Login')

    useUserStore().user = loggedInUser
    await nextTick()

    expect(wrapper.find('[data-image="/avatar.png"]').exists()).toBe(true)
    expect(wrapper.text()).not.toContain('Login')
  })

  it('renders the app bar league title in the mobile-safe title wrapper', () => {
    const wrapper = mountSite(App, {
      global: {
        stubs: {
          ...siteComponentStubs,
          Notifications: true,
          PageTitle: true,
          RouterView: routerViewSlotStub,
          VBottomNavigation: true,
          VFadeTransition: passthroughStub,
          VToolbarItems: passthroughStub,
          'v-fade-transition': passthroughStub,
          FadeTransition: passthroughStub,
        },
      },
    })

    const appTitle = wrapper.get('.app-title')
    const titleText = appTitle.get('.app-title-content').text().replace(/\s+/g, ' ')

    expect(titleText).toContain('Quiz League')
  })

  it('sorts seasons newest first and emits selected season changes', async () => {
    const wrapper = mountSite(SeasonSelect, {
      props: {
        seasonId: '2025-2026',
        inline: true,
        label: 'Season',
      },
    })

    expect(wrapper.findAll('option').map((option) => option.text())).toEqual([
      '',
      '2025/2026',
      '2024/2025',
    ])

    await wrapper.get('select').setValue('2024-2025')

    expect(wrapper.emitted('season')).toEqual([['2024-2025']])
  })

  it('submits email sign-in requests and shows the success state', async () => {
    const wrapper = mountSite(LoginMain, {
      global: {
        mocks: {
          $route: {
            query: {
              forward: '/team/alpha',
            },
          },
        },
      },
    })

    await wrapper.get('input[aria-label="Enter your email address"]').setValue('alice@example.com')
    await clickButton(wrapper, 'Sign in by email')
    await flushPromises()

    expect(mocks.setSidemenu).toHaveBeenCalledWith(false)
    expect(mocks.verifyEmail).toHaveBeenCalledWith('alice@example.com')
    expect(wrapper.text()).toContain('An email has been sent with login instructions.')
  })

  it('shows failed email sign-in messages', async () => {
    mocks.verifyEmail.mockRejectedValue(new Error('Email link failed'))
    const wrapper = mountSite(LoginMain)

    await wrapper.get('input[aria-label="Enter your email address"]').setValue('alice@example.com')
    await clickButton(wrapper, 'Sign in by email')
    await flushPromises()

    expect(wrapper.text()).toContain('Email link failed')
  })

  it('shows the registered user message for every sign-in method when the email is not found', async () => {
    const missingUserMessage =
      'This email does not belong to a registered user.  Please contact your team captain.'
    const cases = [
      {
        button: 'Sign in by email',
        setup: () => mocks.verifyEmail.mockRejectedValue(new Error(missingUserMessage)),
        expectedCall: mocks.verifyEmail,
      },
      {
        button: 'Sign with Google',
        setup: () => mocks.logonWithGoogle.mockRejectedValue(new Error(missingUserMessage)),
        expectedCall: mocks.logonWithGoogle,
      },
      {
        button: 'Sign in with password',
        setup: () => mocks.verifyEmail.mockRejectedValue(new Error(missingUserMessage)),
        expectedCall: mocks.verifyEmail,
      },
    ]

    for (const signInCase of cases) {
      vi.clearAllMocks()
      signInCase.setup()
      const wrapper = mountSite(LoginMain)

      await wrapper
        .get('input[aria-label="Enter your email address"]')
        .setValue('missing@example.com')
      await clickButton(wrapper, signInCase.button)
      await flushPromises()

      expect(signInCase.expectedCall).toHaveBeenCalledWith('missing@example.com')
      expect(wrapper.text()).toContain(missingUserMessage)
    }
  })

  it('saves profile handle changes and forwards when requested', async () => {
    mocks.route.query = {
      first: 'true',
      forward: '/team/alpha',
    }
    const wrapper = mountSite(ProfileEdit)
    await flushPromises()

    await wrapper.get('input[aria-label="Handle"]').setValue('AliceAdmin')
    await clickButton(wrapper, 'Save')
    await flushPromises()

    expect(mocks.saveSiteUser).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'alice',
        handle: 'AliceAdmin',
      }),
    )
    expect(mocks.user?.siteUser.handle).toBe('AliceAdmin')
    expect(mocks.routerPush).toHaveBeenCalledWith('/team/alpha')
  })

  it('renders league table rows with loaded team names and numeric columns', () => {
    mocks.teams.set('alpha', {
      id: 'alpha',
      name: 'Alpha Quiz Team',
      shortName: 'Alpha',
    })
    const wrapper = mountSite(LeagueTableRow, {
      props: {
        row: {
          position: 1,
          team: {
            id: 'alpha',
            path: 'team/alpha',
          },
          played: 10,
          won: 8,
          drawn: 1,
          lost: 1,
          matchPointsFor: 420,
          leaguePoints: 17,
        },
      },
    })

    expect(wrapper.text()).toContain('Alpha Quiz Team')
    expect(wrapper.text()).toContain('420')
    expect(wrapper.get('a').attributes('href')).toBe('/team/alpha')
  })

  it('renders league table rows with Firestore reference-shaped teams', () => {
    mocks.teams.set('alpha', {
      id: 'alpha',
      name: 'Alpha Quiz Team',
      shortName: 'Alpha',
    })
    const wrapper = mountSite(LeagueTableRow, {
      props: {
        row: {
          position: 1,
          team: {
            _key: {
              path: {
                segments: [
                  'projects',
                  'chiltern-ql-firestore',
                  'databases',
                  '(default)',
                  'documents',
                  'team',
                  'alpha',
                ],
              },
            },
          },
          played: 10,
          won: 8,
          drawn: 1,
          lost: 1,
          matchPointsFor: 420,
          leaguePoints: 17,
        },
      },
    })

    expect(wrapper.text()).toContain('Alpha Quiz Team')
    expect(wrapper.get('a').attributes('href')).toBe('/team/alpha')
  })

  it('renders standalone and competition events with localised dates', async () => {
    mocks.standaloneEvents.mockResolvedValue([
      {
        date: '2026-05-24',
        time: '19:30',
        description: 'League AGM',
      },
      {
        date: '2026-06-01',
        time: '20:00',
        competition: {
          path: 'season/2025-2026/competition/cup',
        },
        venue: {
          id: 'town-hall',
        },
      },
    ])
    const wrapper = mountSite(EventsTab, {
      props: {
        seasonId: '2025-2026',
      },
    })
    await flushPromises()

    expect(mocks.standaloneEvents).toHaveBeenCalledWith('2025-2026')
    expect(wrapper.text()).toContain('League AGM : 24 May 2026 19:30')
    expect(wrapper.get('[data-test="competition-link"]').text()).toBe(
      'season/2025-2026/competition/cup',
    )
    expect(wrapper.text()).toContain('1 June 2026 20:00')
    expect(wrapper.get('[data-test="venue-link"]').text()).toBe('town-hall')
  })
})
