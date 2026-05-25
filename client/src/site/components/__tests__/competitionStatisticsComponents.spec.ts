import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import type CompetitionStatistics from '@/entity/CompetitionStatistics'
import CompetitionStatisticsMenu from '../competition/statistics/CompetitionStatisticsMenu.vue'
import CompetitionStatisticsPage from '../competition/statistics/CompetitionStatisticsPage.vue'
import CompetitionStatisticsTitle from '../competition/statistics/CompetitionStatisticsTitle.vue'
import { referencePath } from '../competition/statistics/competitionStatisticsRefs'
import { siteComponentStubs } from './componentStubs'

const mocks = vi.hoisted(() => ({
  competitionsByPath: new Map<string, unknown>(),
  statistics: [] as CompetitionStatistics[],
  teamsByPath: new Map<string, unknown>(),
}))

vi.mock('@/dao/CompetitionDAO', () => ({
  default: {
    getByPath: (path: string) => ({
      __data: mocks.competitionsByPath.get(path),
      path,
    }),
  },
}))

vi.mock('@/dao/CompetitionStatisticsDAO', () => ({
  default: {
    collection: () => ({
      __data: mocks.statistics,
    }),
  },
}))

vi.mock('@/dao/TeamDAO', () => ({
  default: {
    getByPath: (path: string) => ({
      __data: mocks.teamsByPath.get(path),
      path,
    }),
  },
}))

vi.mock('@/services/LayoutService', () => ({
  useLayout: () => ({
    gridSize: 'grid-test',
  }),
}))

vi.mock('@/services/TitleService', () => ({
  default: () => ({
    setTitle: vi.fn(),
  }),
}))

vi.mock('vuefire', () => {
  const resolve = (source: unknown) => {
    const resolved = typeof source === 'function' ? source() : source
    return (resolved as { __data?: unknown } | undefined)?.__data
  }

  return {
    useCollection: (source: unknown) => ref(resolve(source) ?? []),
    useDocument: (source: unknown) => ref(resolve(source)),
  }
})

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
  mocks.competitionsByPath.clear()
  mocks.statistics = []
  mocks.teamsByPath.clear()
})

describe('competition statistics site components', () => {
  it('extracts paths from Firestore reference shapes used in competition statistics rows', () => {
    expect(
      referencePath({
        _key: {
          path: {
            segments: [
              'projects',
              'chiltern-ql-firestore',
              'databases',
              '(default)',
              'documents',
              'season',
              'season-2025-2026',
              'competition',
              'league-main',
            ],
          },
        },
      } as never),
    ).toBe('season/season-2025-2026/competition/league-main')

    expect(
      referencePath({
        _path: {
          canonicalString: () => 'team/team-ashridge-arms',
        },
      } as never),
    ).toBe('team/team-ashridge-arms')
  })

  it('renders the Roll Of Honour menu sorted by competition name', () => {
    mocks.statistics = [
      {
        id: 'cup',
        path: 'competitionstatistics/cup',
        competitionName: 'Knockout Cup',
        results: [],
      },
      {
        id: 'league',
        path: 'competitionstatistics/league',
        competitionName: 'League',
        results: [],
      },
    ]

    const wrapper = mountSite(CompetitionStatisticsMenu)

    const items = wrapper.findAll('button[data-to]')
    expect(items.map((item) => item.attributes('data-title'))).toEqual(['Knockout Cup', 'League'])
    expect(items.map((item) => item.attributes('data-to'))).toEqual([
      '/competition/rollofhonour/knockout-cup',
      '/competition/rollofhonour/league',
    ])
  })

  it('renders a linked season and winner table for a statistics page selected by name', () => {
    mocks.statistics = [
      {
        id: 'uuid-league',
        path: 'competitionstatistics/uuid-league',
        competitionName: 'League',
        results: [
          {
            seasonText: '2025/2026',
            competition: { path: 'season/2025-2026/competition/league', withConverter: vi.fn() },
            teamText: 'Alpha fallback',
            team: { path: 'team/alpha', withConverter: vi.fn() },
          },
          {
            seasonText: '2024/2025',
            teamText: 'Historical winners',
          },
        ],
      },
    ]
    mocks.competitionsByPath.set('season/2025-2026/competition/league', {
      id: 'league',
      path: 'season/2025-2026/competition/league',
      _name: 'league',
      name: 'League',
    })
    mocks.teamsByPath.set('team/alpha', {
      id: 'alpha',
      path: 'team/alpha',
      name: 'Alpha',
    })

    const wrapper = mountSite(CompetitionStatisticsPage, {
      props: {
        id: 'league',
      },
    })

    const rows = wrapper.findAll('tbody tr')
    expect(rows).toHaveLength(2)
    expect(rows[0].text()).toContain('2024/2025')
    expect(rows[0].text()).toContain('Historical winners')
    expect(rows[1].text()).toContain('2025/2026')
    expect(rows[1].text()).toContain('Alpha')
    expect(
      rows[1].find('a[href="/competition/season|2025-2026|competition|league/league"]').exists(),
    ).toBe(true)
    expect(rows[1].find('a[href="/team/alpha"]').exists()).toBe(true)
  })

  it('renders the statistics title from the selected Roll Of Honour entry', () => {
    mocks.statistics = [
      {
        id: 'uuid-league',
        path: 'competitionstatistics/uuid-league',
        competitionName: 'League',
        results: [],
      },
    ]

    const wrapper = mountSite(CompetitionStatisticsTitle, {
      props: {
        id: 'league',
      },
    })

    expect(wrapper.text()).toContain('Roll Of Honour - League')
  })
})
