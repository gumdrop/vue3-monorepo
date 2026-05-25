import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import FetchActions from '../common/FetchActions.vue'
import PageTitle from '../common/PageTitle.vue'
import ResponsiveHeader from '../common/ResponsiveHeader.vue'
import ResponsiveTeamName from '../common/ResponsiveTeamName.vue'
import SideMenu from '../common/SideMenu.vue'
import SideMenuItem from '../common/SideMenuItem.vue'
import TopTitle from '../common/TopTitle.vue'
import { siteComponentStubs } from './componentStubs'

const mocks = vi.hoisted(() => ({
  setTitle: vi.fn(),
}))

vi.mock('@/services/TitleService', () => ({
  default: () => ({
    setTitle: mocks.setTitle,
  }),
}))

const mountSite = (
  component: Parameters<typeof mount>[0],
  options: Parameters<typeof mount>[1] = {},
) =>
  mount(component, {
    ...options,
    global: {
      stubs: siteComponentStubs,
      mocks: {
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

beforeEach(() => {
  vi.clearAllMocks()
})

describe('common site components', () => {
  it('emits fetch-size changes from FetchActions', async () => {
    const wrapper = mountSite(FetchActions, {
      props: {
        initialFetch: 1,
      },
    })

    await wrapper.findAll('button')[1].trigger('click')
    await nextTick()
    await wrapper.findAll('button')[2].trigger('click')
    await nextTick()

    expect(wrapper.emitted('fetch')).toEqual([[5], [Number.MAX_SAFE_INTEGER]])
  })

  it('sends page-title updates through the title service', () => {
    mountSite(PageTitle, {
      props: {
        title: 'Competition Fixtures',
      },
    })

    expect(mocks.setTitle).toHaveBeenCalledWith('Competition Fixtures')
  })

  it('uses compact and regular heading tags based on the Vuetify display size', () => {
    const compact = mountSite(ResponsiveHeader, {
      slots: {
        default: 'Small Header',
      },
      global: {
        mocks: {
          $vuetify: {
            display: {
              smAndDown: true,
              smAndUp: false,
            },
          },
        },
      },
    })

    const regular = mountSite(ResponsiveHeader, {
      slots: {
        default: 'Large Header',
      },
    })

    expect(compact.get('h6').text()).toBe('Small Header')
    expect(regular.get('h3').text()).toBe('Large Header')
  })

  it('switches team names for compact displays', () => {
    const team = {
      id: 'alpha',
      name: 'Alpha Quiz Team',
      shortName: 'Alpha',
    }
    const compact = mountSite(ResponsiveTeamName, {
      props: {
        team,
      },
      global: {
        mocks: {
          $vuetify: {
            display: {
              smAndDown: true,
              smAndUp: false,
            },
          },
        },
      },
    })

    const regular = mountSite(ResponsiveTeamName, {
      props: {
        team,
      },
    })

    expect(compact.text()).toBe('Alpha')
    expect(regular.text()).toBe('Alpha Quiz Team')
  })

  it('splits the top title into first and secondary words', () => {
    const wrapper = mountSite(TopTitle, {
      props: {
        title: 'Chiltern Quiz League Website',
      },
    })

    expect(wrapper.find('.page-header-first').text()).toBe('Chiltern')
    expect(wrapper.find('.page-header-rest').text()).toBe('Quiz League')
  })

  it('renders side-menu links with route metadata', () => {
    const wrapper = mountSite(SideMenu, {
      props: {
        title: 'Teams',
        icon: 'mdi-account-group',
      },
      slots: {
        default: '<span data-test="menu-content">Nested Teams</span>',
      },
    })

    expect(wrapper.text()).toContain('Teams')
    expect(wrapper.get('[data-test="menu-content"]').text()).toBe('Nested Teams')
  })

  it('passes navigation props through SideMenuItem', () => {
    const wrapper = mountSite(SideMenuItem, {
      props: {
        to: '/team/alpha',
        icon: 'mdi-account-group',
        title: 'Alpha',
      },
    })

    const item = wrapper.get('button')
    expect(item.attributes('data-to')).toBe('/team/alpha')
    expect(item.attributes('data-title')).toBe('Alpha')
    expect(item.text()).toBe('Alpha')
  })
})
