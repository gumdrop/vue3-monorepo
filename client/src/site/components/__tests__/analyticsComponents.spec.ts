import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import AnalyticsMain from '../analytics/AnalyticsMain.vue'
import AnalyticsTitle from '../analytics/AnalyticsTitle.vue'
import { siteComponentStubs } from './componentStubs'

const mocks = vi.hoisted(() => ({
  aggregation: null as unknown,
  appContext: {
    id: 'site',
    path: 'applicationcontext/site',
    currentSeason: {
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
          ],
        },
      },
    },
  },
}))

const docRef = <T>(path: string, data: T) => ({
  id: path.split('/').pop() ?? path,
  path,
  __data: data,
  withConverter: vi.fn(),
})

const dataForDocument = (source: unknown) => {
  const resolved = typeof source === 'function' ? source() : source
  return (resolved as { __data?: unknown } | undefined)?.__data
}

vi.mock('@/dao/ApplicationContextDAO', () => ({
  default: {
    get: () => docRef('applicationcontext/site', mocks.appContext),
  },
}))

vi.mock('@/dao/SeasonStatisticsAggregationDAO', () => ({
  default: {
    getById: (id: string) => docRef(`seasonstatisticsaggregation/${id}`, mocks.aggregation),
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

vi.mock('vuefire', () => ({
  useDocument: (source: unknown) => ref(dataForDocument(source)),
}))

const mountAnalytics = async () => {
  const wrapper = mount(AnalyticsMain, {
    global: {
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

beforeEach(() => {
  vi.clearAllMocks()
  mocks.aggregation = null
})

describe('AnalyticsMain', () => {
  it('renders the analytics route title', () => {
    const wrapper = mount(AnalyticsTitle, {
      global: {
        stubs: siteComponentStubs,
      },
    })

    expect(wrapper.text()).toContain('mdi-chart-timeline-variant')
    expect(wrapper.text()).toContain('Analytics')
  })

  it('uses an already-loaded application context to select the initial season', async () => {
    const wrapper = await mountAnalytics()

    expect(wrapper.text()).not.toContain('Loading application context')
    expect(wrapper.get('[data-test="season-select"]').text()).toContain('season-2025-2026')
    expect(wrapper.text()).toContain('No analytics data available for this season')
  })

  it('keeps the analytics table mounted when changing snapshots', async () => {
    mocks.aggregation = {
      id: 'season-2025-2026',
      path: 'seasonstatisticsaggregation/season-2025-2026',
      competitions: [
        {
          competition: { id: 'league-main', path: 'season/season-2025-2026/competition/league-main' },
          competitionName: 'League Championship',
          tableSnapshots: [
            {
              fixtureSetDescription: 'Round 1',
              fixtureSetDate: '2026-05-07',
              tables: [
                {
                  table: { id: 'league-table', path: 'season/season-2025-2026/competition/league-main/leaguetable/league-table' },
                  description: 'League Championship Table',
                  rows: [
                    { position: '1', team: { id: 'alpha', path: 'team/alpha' } },
                    { position: '2', team: { id: 'bravo', path: 'team/bravo' } },
                  ],
                },
              ],
            },
            {
              fixtureSetDescription: 'Round 2',
              fixtureSetDate: '2026-05-14',
              tables: [
                {
                  table: { id: 'league-table', path: 'season/season-2025-2026/competition/league-main/leaguetable/league-table' },
                  description: 'League Championship Table',
                  rows: [
                    { position: '1', team: { id: 'bravo', path: 'team/bravo' } },
                    { position: '2', team: { id: 'alpha', path: 'team/alpha' } },
                  ],
                },
              ],
            },
          ],
        },
      ],
    }
    const wrapper = await mountAnalytics()

    await wrapper.get('select[aria-label="Select Competition"]').setValue('league-main')
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
})
