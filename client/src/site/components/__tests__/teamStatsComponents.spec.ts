import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { siteComponentStubs } from './componentStubs'
import AllSeasonsHighlights from '../team/stats/AllSeasonsHighlights.vue'
import HeadToHeadLeaders from '../team/stats/HeadToHeadLeaders.vue'
import SeasonHighlights from '../team/stats/SeasonHighlights.vue'
import SeasonLeaguePosition from '../team/stats/SeasonLeaguePosition.vue'
import SeasonStats from '../team/stats/SeasonStats.vue'

const mocks = vi.hoisted(() => ({
  positionData: vi.fn(),
  seasonId: 'season-1',
  setSeason: vi.fn(),
  stats: [] as unknown[],
  teamStats: vi.fn(),
  teamCount: vi.fn(),
  singleSeasonHighlights: vi.fn(),
  allSeasonsHighlights: vi.fn(),
  headToHeadLeaders: vi.fn(),
}))

vi.mock('@/dao/StatisticsDAO', () => ({
  default: {
    teamStats: mocks.teamStats,
  },
}))

vi.mock('@/services/TeamService', () => ({
  useTeams: () => ({
    positionData: mocks.positionData,
    matchScoresData: vi.fn(),
    cumulativeScoresData: vi.fn(),
    cumulativePointsDifferenceData: vi.fn(),
    singleSeasonResultTypes: vi.fn(),
    singleSeasonHighlights: mocks.singleSeasonHighlights,
    teamCount: mocks.teamCount,
    allSeasonsHighlights: mocks.allSeasonsHighlights,
    headToHeadLeaders: mocks.headToHeadLeaders,
  }),
}))

vi.mock('@/stores/teams', async () => {
  const { ref } = await import('vue')

  return {
    useTeamStore: () => ({
      seasonId: ref(mocks.seasonId),
      setSeason: mocks.setSeason,
    }),
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
  }
})

const lineChartStub = defineComponent({
  props: {
    options: Object,
  },
  setup(props) {
    const yAxisMax = () =>
      (
        props.options as {
          scales?: {
            y?: {
              max?: number
              ticks?: { callback?: (value: number) => string; count?: number }
            }
          }
        }
      )?.scales?.y?.max
    const tickCount = () =>
      (
        props.options as {
          scales?: { y?: { ticks?: { count?: number } } }
        }
      )?.scales?.y?.ticks?.count
    const tickLabel = (value: number) =>
      (
        props.options as {
          scales?: { y?: { ticks?: { callback?: (value: number) => string } } }
        }
      )?.scales?.y?.ticks?.callback?.(value)

    return () =>
      h('div', {
        'data-test': 'line-chart',
        'data-y-axis-max': yAxisMax() === undefined ? undefined : String(yAxisMax()),
        'data-y-axis-tick-count': tickCount() === undefined ? undefined : String(tickCount()),
        'data-y-axis-integer-tick': tickLabel(1),
        'data-y-axis-decimal-tick': tickLabel(1.1),
      })
  },
})

const passthroughStub = defineComponent({
  setup(_, { slots }) {
    return () => h('div', slots.default?.())
  },
})

const stats = {
  id: 'alpha-season-1',
  path: 'statistics/alpha-season-1',
  team: { id: 'alpha', path: 'team/alpha' },
  season: { id: 'season-1', path: 'season/season-1' },
  table: { id: 'main', path: 'season/season-1/competition/league/leaguetable/main' },
  seasonStats: {
    currentLeaguePosition: 2,
    runningPointsFor: 0,
    runningPointsAgainst: 0,
    runningPointsDifference: 0,
    headToHead: [],
  },
  weekStats: {},
}

beforeEach(() => {
  vi.clearAllMocks()
  mocks.seasonId = 'season-1'
  mocks.stats = [stats]
  mocks.positionData.mockReturnValue({ datasets: [], labels: [] })
  mocks.teamCount.mockResolvedValue(4)
  mocks.singleSeasonHighlights.mockReturnValue([
    { title: 'Highest position', value: '1st', detail: '15 Jan' },
    { title: 'Biggest margin of defeat', value: '20', detail: '0-20, 15 Jan' },
  ])
  mocks.allSeasonsHighlights.mockResolvedValue([])
  mocks.headToHeadLeaders.mockResolvedValue({
    mostBeaten: [],
    mostLostTo: [],
  })
  mocks.teamStats.mockImplementation(() => ({ __data: mocks.stats }))
})

describe('team statistics components', () => {
  it('renders the position chart while the season team count is loading', async () => {
    let resolveTeamCount: (count: number) => void = () => {}
    mocks.teamCount.mockReturnValue(
      new Promise<number>((resolve) => {
        resolveTeamCount = resolve
      }),
    )

    const wrapper = mount(SeasonLeaguePosition, {
      props: {
        stats,
      },
      global: {
        stubs: {
          LineChart: lineChartStub,
        },
      },
    })

    expect(wrapper.get('[data-test="line-chart"]').attributes('data-y-axis-max')).toBeUndefined()

    resolveTeamCount(4)
    await flushPromises()

    expect(wrapper.get('[data-test="line-chart"]').attributes('data-y-axis-max')).toBe('4')
  })

  it('renders the single-season stats view with the selected season team-count axis', async () => {
    const wrapper = mount(SeasonStats, {
      props: {
        teamId: 'alpha',
      },
      global: {
        stubs: {
          ...siteComponentStubs,
          LineChart: lineChartStub,
          ResultTypes: passthroughStub,
          SeasonCumulativePointsDiff: passthroughStub,
          SeasonCumulativeScores: passthroughStub,
          SeasonMatchScores: passthroughStub,
          SeasonSelect: passthroughStub,
        },
        mocks: {
          $vuetify: {
            display: {
              smAndDown: false,
              smAndUp: true,
            },
          },
        },
      },
    })

    await flushPromises()

    expect(mocks.teamStats).toHaveBeenCalledWith('alpha', 'season-1')
    expect(wrapper.get('[data-test="line-chart"]').attributes('data-y-axis-max')).toBe('4')
    expect(wrapper.get('[data-test="line-chart"]').attributes('data-y-axis-tick-count')).toBe('4')
    expect(wrapper.get('[data-test="line-chart"]').attributes('data-y-axis-integer-tick')).toBe('1')
    expect(wrapper.get('[data-test="line-chart"]').attributes('data-y-axis-decimal-tick')).toBe('')
    expect(wrapper.text()).toContain('Season Highlights')
    expect(wrapper.text()).toContain('Biggest margin of defeat')
  })

  it('renders single-season highlights', () => {
    const wrapper = mount(SeasonHighlights, {
      props: {
        stats,
      },
      global: {
        stubs: siteComponentStubs,
      },
    })

    expect(mocks.singleSeasonHighlights).toHaveBeenCalledWith(stats)
    expect(wrapper.text()).toContain('Season Highlights')
    expect(wrapper.text()).toContain('Highest position')
    expect(wrapper.text()).toContain('1st')
    expect(wrapper.text()).toContain('15 Jan')
    expect(wrapper.text()).toContain('Biggest margin of defeat')
    expect(wrapper.text()).toContain('0-20, 15 Jan')
  })

  it('renders all-season highlights', async () => {
    mocks.allSeasonsHighlights.mockResolvedValue([
      { title: 'Highest final league position', value: '1st', detail: '2024/25' },
      { title: 'Biggest margin of victory', value: '30', detail: '50-20, 1 Jan, 2025/26' },
    ])

    const wrapper = mount(AllSeasonsHighlights, {
      props: {
        stats: [stats],
      },
      global: {
        stubs: siteComponentStubs,
      },
    })

    await flushPromises()

    expect(mocks.allSeasonsHighlights).toHaveBeenCalledWith([stats])
    expect(wrapper.text()).toContain('All Seasons Highlights')
    expect(wrapper.text()).toContain('Highest final league position')
    expect(wrapper.text()).toContain('1st')
    expect(wrapper.text()).toContain('2024/25')
    expect(wrapper.text()).toContain('Biggest margin of victory')
    expect(wrapper.text()).toContain('50-20, 1 Jan, 2025/26')
  })

  it('renders all-season head-to-head leaders', async () => {
    mocks.headToHeadLeaders.mockResolvedValue({
      mostBeaten: [{ team: 'Bravo', win: 3, lose: 1 }],
      mostLostTo: [
        { team: 'Charlie', win: 0, lose: 4 },
        { team: 'Delta', win: 1, lose: 4 },
      ],
    })

    const wrapper = mount(HeadToHeadLeaders, {
      props: {
        stats: [stats],
      },
      global: {
        stubs: siteComponentStubs,
      },
    })

    await flushPromises()

    expect(mocks.headToHeadLeaders).toHaveBeenCalledWith([stats])
    expect(wrapper.text()).toContain('Head-to-Head Highlights')
    expect(wrapper.text()).toContain('Teams beaten most often')
    expect(wrapper.text()).toContain('Bravo (3 wins)')
    expect(wrapper.text()).toContain('Teams who beat this team most often')
    expect(wrapper.text()).toContain('Charlie (4 losses)')
    expect(wrapper.text()).toContain('Delta (4 losses)')
  })

  it('renders all-season head-to-head empty states', async () => {
    const wrapper = mount(HeadToHeadLeaders, {
      props: {
        stats: [stats],
      },
      global: {
        stubs: siteComponentStubs,
      },
    })

    await flushPromises()

    expect(wrapper.text()).toContain('Teams beaten most often')
    expect(wrapper.text()).toContain('No wins recorded.')
    expect(wrapper.text()).toContain('Teams who beat this team most often')
    expect(wrapper.text()).toContain('No losses recorded.')
  })
})
