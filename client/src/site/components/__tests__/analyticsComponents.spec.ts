import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia, type Pinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { computed } from 'vue'
import { useAnalyticsStore } from '@/stores/analytics'
import AnalyticsAllSeasons from '../analytics/AnalyticsAllSeasons.vue'
import AnalyticsMenu from '../analytics/AnalyticsMenu.vue'
import AnalyticsMain from '../analytics/AnalyticsMain.vue'
import AnalyticsReplay from '../analytics/AnalyticsReplay.vue'
import AnalyticsTitle from '../analytics/AnalyticsTitle.vue'
import { siteComponentStubs } from './componentStubs'

const mocks = vi.hoisted(() => ({
  aggregation: null as unknown,
  aggregations: [] as unknown[],
  getDoc: vi.fn(),
  setSidemenu: vi.fn(),
  appContext: {
    id: 'site',
    path: 'applicationcontext/site',
    currentSeason: {
      id: 'season-2025-2026',
      path: 'season/season-2025-2026',
    },
  },
}))

const docRef = <T>(path: string, data: T) => ({
  id: path.split('/').pop() ?? path,
  path,
  __data: data,
  withConverter: vi.fn(),
})

const snapshot = (data: unknown) => ({
  data: () => data,
})

const dataForDocument = (source: unknown) => {
  const resolved = typeof source === 'function' ? source() : source
  return (resolved as { __data?: unknown } | undefined)?.__data
}

const leagueTableRow = (
  position: string,
  teamId: string,
  played: number,
  matchPointsFor: number,
) => ({
  position,
  team: { id: teamId, path: `team/${teamId}` },
  played,
  won: 0,
  drawn: 0,
  lost: 0,
  leaguePoints: 0,
  matchPointsFor,
  matchPointsAgainst: 0,
})

vi.mock('@/dao/ApplicationContextDAO', () => ({
  default: {
    get: () => docRef('applicationcontext/site', mocks.appContext),
  },
}))

vi.mock('@/dao/SeasonStatisticsAggregationDAO', () => ({
  default: {
    getById: (id: string) => docRef(`seasonstatisticsaggregation/${id}`, mocks.aggregation),
    collection: () => docRef('seasonstatisticsaggregation', mocks.aggregations),
  },
}))

vi.mock('../season/SeasonSelect.vue', () => ({
  default: {
    props: ['seasonId'],
    template: '<div data-test="season-select">{{ seasonId }}</div>',
  },
}))

vi.mock('../leaguetable/LeagueTableRow.vue', () => ({
  default: {
    props: ['row'],
    template: '<tr><td>{{ row.position }}</td><td>{{ row.team.id || row.team.path }}</td></tr>',
  },
}))

vi.mock('firebase/firestore', () => ({
  getDoc: mocks.getDoc,
}))

vi.mock('vuefire', () => ({
  useDocument: (source: unknown) => computed(() => dataForDocument(source)),
  useCollection: (source: unknown) => computed(() => dataForDocument(source) ?? []),
}))

vi.mock('vue-chartjs', () => ({
  Line: {
    props: ['data'],
    template: '<div data-test="line-chart">{{ JSON.stringify(data) }}</div>',
  },
}))

vi.mock('@/stores/app', () => ({
  useSideMenuStore: () => ({
    setSidemenu: mocks.setSidemenu,
  }),
}))

let pinia: Pinia

const mountAnalytics = async () => {
  const wrapper = mount(AnalyticsMain, {
    global: {
      plugins: [pinia],
      stubs: {
        ...siteComponentStubs,
        VSlider: {
          props: ['modelValue'],
          template: '<input data-test="snapshot-slider" :value="modelValue" />',
        },
      },
    },
  })
  await flushPromises()
  return wrapper
}

const mountAnalyticsReplay = async () => {
  const wrapper = mount(AnalyticsReplay, {
    global: {
      plugins: [pinia],
      stubs: {
        ...siteComponentStubs,
        VSlider: {
          props: ['modelValue'],
          template: '<input data-test="snapshot-slider" :value="modelValue" />',
        },
      },
    },
  })
  await flushPromises()
  return wrapper
}

const mountAnalyticsAllSeasons = async () => {
  const wrapper = mount(AnalyticsAllSeasons, {
    global: {
      plugins: [pinia],
      stubs: {
        ...siteComponentStubs,
        Line: {
          props: ['data'],
          template: '<div data-test="line-chart">{{ JSON.stringify(data) }}</div>',
        },
      },
    },
  })
  await flushPromises()
  return wrapper
}

const mountAnalyticsMenu = async () => {
  const wrapper = mount(AnalyticsMenu, {
    global: {
      plugins: [pinia],
      stubs: siteComponentStubs,
    },
  })
  await flushPromises()
  return wrapper
}

const analyticsAggregation = (seasonId = 'season-2025-2026') => ({
  id: seasonId,
  path: `seasonstatisticsaggregation/${seasonId}`,
  season: { id: seasonId, path: `season/${seasonId}` },
  generatedAt: '2026-06-01T09:30:00.000Z',
  competitions: [
    {
      competition: { id: 'league-main', path: `season/${seasonId}/competition/league-main` },
      competitionName: 'League Championship',
      fixtureSetCount: 2,
      completedFixtureSetCount: 2,
      fixtureCount: 4,
      complete: true,
      averageScore: 37.875,
      averageWinningScore: 41,
      averageLosingScore: 38,
      winner: { id: 'alpha', path: 'team/alpha' },
      winnerText: 'Alpha',
      tableSnapshots: [
        {
          fixtureSetDescription: 'Round 1',
          fixtureSetDate: '2026-05-07',
          tables: [
            {
              table: {
                id: 'league-table',
                path: `season/${seasonId}/competition/league-main/leaguetable/league-table`,
              },
              description: 'League Championship Table',
              rows: [leagueTableRow('1', 'alpha', 1, 42), leagueTableRow('2', 'bravo', 1, 38)],
            },
          ],
        },
        {
          fixtureSetDescription: 'Round 2',
          fixtureSetDate: '2026-05-14',
          tables: [
            {
              table: {
                id: 'league-table',
                path: `season/${seasonId}/competition/league-main/leaguetable/league-table`,
              },
              description: 'League Championship Table',
              rows: [leagueTableRow('1', 'bravo', 2, 82), leagueTableRow('2', 'alpha', 2, 80)],
            },
          ],
        },
      ],
    },
    {
      competition: { id: 'cup-main', path: `season/${seasonId}/competition/cup-main` },
      competitionName: 'Cup Championship',
      fixtureSetCount: 3,
      completedFixtureSetCount: 2,
      fixtureCount: 6,
      complete: false,
      averageScore: 36.2,
      averageWinningScore: 42.4,
      averageLosingScore: 31.1,
      tableSnapshots: [],
    },
  ],
})

const analyticsAllSeasonAggregation = (
  seasonId: string,
  averages: {
    averageScore: number
    averageWinningScore: number
    averageLosingScore: number
  },
  winnerText: string,
) => {
  const aggregation = analyticsAggregation(seasonId)
  const leagueCompetition = aggregation.competitions[0] as Record<string, unknown>

  leagueCompetition.averageScore = averages.averageScore
  leagueCompetition.averageWinningScore = averages.averageWinningScore
  leagueCompetition.averageLosingScore = averages.averageLosingScore
  leagueCompetition.winnerText = winnerText
  leagueCompetition.winner = {
    id: winnerText.toLowerCase(),
    path: `team/${winnerText.toLowerCase()}`,
  }

  return aggregation
}

const internalReference = (path: string) => ({
  _key: {
    path: {
      segments: [
        'projects',
        'chiltern-ql-firestore',
        'databases',
        '(default)',
        'documents',
        ...path.split('/'),
      ],
    },
  },
})

const analyticsAggregationWithInternalCompetitionRefs = () => {
  const aggregation = analyticsAggregation()
  aggregation.competitions = aggregation.competitions.map((competition) => ({
    ...competition,
    competition: internalReference(competition.competition.path),
  }))
  return aggregation
}

beforeEach(() => {
  vi.clearAllMocks()
  pinia = createPinia()
  setActivePinia(pinia)
  mocks.aggregation = null
  mocks.aggregations = []
  mocks.getDoc.mockResolvedValue(snapshot(mocks.appContext))
})

describe('AnalyticsMain', () => {
  it('renders the analytics route title', () => {
    const wrapper = mount(AnalyticsTitle, {
      global: {
        stubs: siteComponentStubs,
      },
    })

    expect(wrapper.text()).toContain('mdi-chart-timeline-variant')
    expect(wrapper.text()).toContain('Seasons')
  })

  it('uses an already-loaded application context to select the initial season', async () => {
    const wrapper = await mountAnalytics()

    expect(wrapper.text()).not.toContain('Loading application context')
    expect(wrapper.get('[data-test="season-select"]').text()).toContain('season-2025-2026')
    expect(wrapper.text()).toContain('No analytics data available for this season')
    expect(useAnalyticsStore().seasonId).toBe('season-2025-2026')
  })

  it('shows the aggregate overview as the default selected competition page', async () => {
    mocks.aggregation = analyticsAggregation()
    const wrapper = await mountAnalytics()

    await wrapper.get('select[aria-label="Select Competition"]').setValue('cup-main')
    await flushPromises()

    expect(wrapper.get('[data-test="analytics-overview"]').text()).toContain('Cup Championship')
    expect(wrapper.text()).toContain('2/3')
    expect(wrapper.text()).toContain('Fixtures counted')
    expect(wrapper.text()).toContain('Average winning score')
    expect(wrapper.text()).toContain('Pending')
    expect(wrapper.get('[data-test="analytics-overview"]').text()).not.toContain('36.2')
    expect(wrapper.get('[data-test="analytics-overview"]').text()).not.toContain('42.4')
    expect(wrapper.get('[data-test="analytics-overview"]').text()).not.toContain('31.1')
    expect(wrapper.find('[data-test="analytics-replay"]').exists()).toBe(false)
    expect(useAnalyticsStore().competitionId).toBe('cup-main')
  })

  it('keeps selector state when moving from overview to replay', async () => {
    mocks.aggregation = analyticsAggregation()
    const overview = await mountAnalytics()

    await overview.get('select[aria-label="Select Competition"]').setValue('league-main')
    await flushPromises()
    await overview.get('select[aria-label="Select Competition"]').setValue('')
    await flushPromises()
    overview.unmount()

    const replay = await mountAnalyticsReplay()

    expect(
      replay.get<HTMLSelectElement>('select[aria-label="Select Competition"]').element.value,
    ).toBe('league-main')
    expect(replay.text()).toContain('Round 1')
    expect(useAnalyticsStore().competitionId).toBe('league-main')
  })

  it('keeps selector state when stale aggregation data mounts during page movement', async () => {
    const analyticsStore = useAnalyticsStore()
    analyticsStore.setSeason('season-2025-2026')
    analyticsStore.setCompetition('cup-main')
    const staleAggregation = analyticsAggregation('season-2024-2025')
    staleAggregation.competitions = staleAggregation.competitions.filter(
      (competition) => competition.competition.id !== 'cup-main',
    )
    mocks.aggregation = staleAggregation

    const staleMenu = await mountAnalyticsMenu()

    expect(useAnalyticsStore().seasonId).toBe('season-2025-2026')
    expect(useAnalyticsStore().competitionId).toBe('cup-main')
    staleMenu.unmount()

    mocks.aggregation = analyticsAggregation()
    const replay = await mountAnalyticsReplay()

    expect(
      replay.get<HTMLSelectElement>('select[aria-label="Select Competition"]').element.value,
    ).toBe('cup-main')
    expect(replay.text()).toContain('No replay data available for this competition')
  })

  it('keeps selector state when aggregation competition references have no id field', async () => {
    mocks.aggregation = analyticsAggregationWithInternalCompetitionRefs()
    const analyticsStore = useAnalyticsStore()
    analyticsStore.setSeason('season-2025-2026')
    analyticsStore.setCompetition('league-main')

    const replay = await mountAnalyticsReplay()

    expect(
      replay.get<HTMLSelectElement>('select[aria-label="Select Competition"]').element.value,
    ).toBe('league-main')
    expect(replay.text()).toContain('Round 1')
    expect(useAnalyticsStore().competitionId).toBe('league-main')
  })
})

describe('AnalyticsReplay', () => {
  it('keeps the analytics table mounted when changing replay snapshots', async () => {
    mocks.aggregation = analyticsAggregation()
    const analyticsStore = useAnalyticsStore()
    analyticsStore.setSeason('season-2025-2026')
    analyticsStore.setCompetition('league-main')
    const wrapper = await mountAnalyticsReplay()

    await flushPromises()
    const tableElement = wrapper.get('table').element
    expect(wrapper.text()).toContain('Round 1')
    expect(wrapper.text()).toContain('1alpha')

    const nextButton = wrapper
      .findAll('button')
      .find((button) => button.text().includes('mdi-chevron-right'))
    expect(nextButton).toBeDefined()
    await nextButton!.trigger('click')
    await flushPromises()

    expect(wrapper.get('table').element).toBe(tableElement)
    expect(wrapper.text()).toContain('Round 2')
    expect(wrapper.text()).toContain('1bravo')
  })

  it('shows a replay-specific empty state for competitions without snapshots', async () => {
    mocks.aggregation = analyticsAggregation()
    const analyticsStore = useAnalyticsStore()
    analyticsStore.setSeason('season-2025-2026')
    analyticsStore.setCompetition('cup-main')
    const wrapper = await mountAnalyticsReplay()

    expect(wrapper.text()).toContain('No replay data available for this competition')
    expect(wrapper.find('[data-test="analytics-replay"]').exists()).toBe(false)
  })
})

describe('AnalyticsAllSeasons', () => {
  it('shows all-season average scores and winner summary for the selected competition', async () => {
    mocks.aggregation = analyticsAggregation()
    mocks.aggregations = [
      analyticsAllSeasonAggregation(
        'season-2024-2025',
        {
          averageScore: 34.2,
          averageWinningScore: 41.5,
          averageLosingScore: 28.4,
        },
        'Bravo',
      ),
      analyticsAllSeasonAggregation(
        'season-2023-2024',
        {
          averageScore: 31.8,
          averageWinningScore: 38.1,
          averageLosingScore: 25.6,
        },
        'Alpha',
      ),
      analyticsAllSeasonAggregation(
        'season-2025-2026',
        {
          averageScore: 37.9,
          averageWinningScore: 42,
          averageLosingScore: 32.3,
        },
        'Alpha',
      ),
    ]
    const analyticsStore = useAnalyticsStore()
    analyticsStore.setSeason('season-2025-2026')
    analyticsStore.setCompetition('league-main')

    const wrapper = await mountAnalyticsAllSeasons()

    const page = wrapper.get('[data-test="analytics-all-seasons"]')
    expect(page.text()).toContain('League Championship')
    expect(page.text()).toContain('Seasons counted')
    expect(page.text()).toMatch(/Seasons counted\s*3/)
    expect(page.text()).toContain('Different winners')
    expect(page.text()).toMatch(/Different winners\s*2/)
    expect(page.text()).toContain('Most successful team(s)')
    expect(page.text()).toMatch(/Most successful team\(s\)\s*Alpha/)
    expect(page.text()).toContain('Highest average score')
    expect(page.text()).toMatch(/Highest average score\s*Bravo \(41\)/)
    expect(page.text()).toContain('Alpha')
    expect(page.text()).toContain('Average Scores')
    expect(page.text()).toContain('2023/2024')
    expect(page.text()).toContain('2024/2025')
    expect(page.text()).toContain('2025/2026')
    expect(
      wrapper.get<HTMLSelectElement>('select[aria-label="Select Competition"]').element.value,
    ).toBe('league-main')

    const chartText = wrapper.get('[data-test="line-chart"]').text()
    expect(chartText).toContain('Average score')
    expect(chartText).toContain('Average winning score')
    expect(chartText).toContain('Average losing score')
    expect(chartText).toContain('2023/2024')
    expect(chartText).not.toContain('31.8')
    expect(chartText).not.toContain('37.9')
    expect(
      JSON.parse(chartText).datasets.map((dataset: { data: number[] }) => dataset.data),
    ).toEqual([
      [32, 34, 38],
      [38, 42, 42],
      [26, 28, 32],
    ])
  })
})

describe('AnalyticsMenu', () => {
  it('shows overview and replay entries for a league competition with snapshots', async () => {
    mocks.aggregation = analyticsAggregation()
    const analyticsStore = useAnalyticsStore()
    analyticsStore.setSeason('season-2025-2026')
    analyticsStore.setCompetition('league-main')

    const wrapper = await mountAnalyticsMenu()

    expect(wrapper.text()).toContain('League Championship')
    expect(wrapper.text()).toContain('Overview')
    expect(wrapper.text()).toContain('Replay')
    expect(wrapper.text()).toContain('All Seasons')
    expect(
      wrapper.findAll('button[data-to]').map((button) => button.attributes('data-to')),
    ).toEqual(['/analytics', '/analytics/replay', '/analytics/all-seasons'])
    expect(mocks.setSidemenu).toHaveBeenCalledWith(true)
  })

  it('shows overview and all-seasons entries for a competition without replay snapshots', async () => {
    mocks.aggregation = analyticsAggregation()
    const analyticsStore = useAnalyticsStore()
    analyticsStore.setSeason('season-2025-2026')
    analyticsStore.setCompetition('cup-main')

    const wrapper = await mountAnalyticsMenu()

    expect(wrapper.text()).toContain('Cup Championship')
    expect(wrapper.text()).toContain('Overview')
    expect(wrapper.text()).not.toContain('Replay')
    expect(wrapper.text()).toContain('All Seasons')
    expect(
      wrapper.findAll('button[data-to]').map((button) => button.attributes('data-to')),
    ).toEqual(['/analytics', '/analytics/all-seasons'])
  })
})
