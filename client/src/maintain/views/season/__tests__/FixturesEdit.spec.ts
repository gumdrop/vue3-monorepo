import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import type Team from '@/entity/Team'
import type Venue from '@/entity/Venue'
import type { Fixture } from '@/entity/Fixtures'
import FixturesEdit from '../FixturesEdit.vue'
import { maintenanceComponentStubs } from '@/maintain/__tests__/componentStubs'

const mocks = vi.hoisted(() => ({
  route: {
    params: {
      seasonId: 'season-1',
      competitionId: 'competition-1',
      id: 'fixture-set-1',
    },
  },
  routerPush: vi.fn(),
  fixturesDAO: {
    getDataByPath: vi.fn(),
    save: vi.fn(),
  },
  textDAO: {
    getByPath: vi.fn((pathish: { id?: string; path: string } | string) => {
      const path = typeof pathish === 'string' ? pathish : pathish.path
      return { id: path.split('/').at(-1), path }
    }),
    getData: vi.fn(),
    save: vi.fn(),
  },
  fixtureDAO: {
    entities: vi.fn(),
    subCollection: vi.fn((path: string) => `${path}/fixture`),
    save: vi.fn(),
    remove: vi.fn(),
  },
  teamDAO: {
    list: vi.fn(),
    getByPath: vi.fn((path: string) => ({ id: path.split('/').at(-1), path })),
  },
  venueDAO: {
    list: vi.fn(),
    getByPath: vi.fn((path: string) => ({ id: path.split('/').at(-1), path })),
  },
  axiosPost: vi.fn(),
  uuid: vi.fn(),
}))

vi.mock('axios', () => ({
  default: {
    post: mocks.axiosPost,
  },
}))

vi.mock('vue-router', () => ({
  useRoute: () => mocks.route,
  useRouter: () => ({ push: mocks.routerPush }),
}))

vi.mock('@/dao/FixturesDAO', () => ({
  default: mocks.fixturesDAO,
  fixtureDAO: mocks.fixtureDAO,
}))

vi.mock('@/dao/TextDAO', () => ({
  default: mocks.textDAO,
}))

vi.mock('@/dao/TeamDAO', () => ({
  default: mocks.teamDAO,
}))

vi.mock('@/dao/VenueDAO', () => ({
  default: mocks.venueDAO,
}))

vi.mock('uuid', () => ({ v4: mocks.uuid }))

const team = (id: string): Team =>
  ({
    id,
    path: `team/${id}`,
    name: id,
    shortName: id,
    venue: { id: `${id}-venue`, path: `venue/${id}-venue` },
    text: { id: `${id}-text`, path: `text/${id}-text` },
    users: [],
    retired: false,
  }) as Team

const venue = (id: string): Venue =>
  ({
    id,
    path: `venue/${id}`,
    name: id,
    address: '',
    retired: false,
  }) as Venue

const fixture = (id: string, homeId: string, awayId: string): Fixture =>
  ({
    id,
    path: `season/season-1/competition/competition-1/fixtures/fixture-set-1/fixture/${id}`,
    home: { id: homeId, path: `team/${homeId}` },
    away: { id: awayId, path: `team/${awayId}` },
    venue: { id: `${homeId}-venue`, path: `venue/${homeId}-venue` },
  }) as Fixture

const mountFixturesEdit = async () => {
  const wrapper = mount(FixturesEdit, {
    global: {
      stubs: {
        ...maintenanceComponentStubs,
        TextEdit: summaryTextEditStub,
      },
    },
  })
  await flushPromises()
  return wrapper
}

const summaryTextEditStub = defineComponent({
  props: {
    modelValue: Object,
  },
  emits: ['save', 'update:modelValue'],
  setup(props, { emit }) {
    return () =>
      props.modelValue
        ? h('div', { 'data-test': 'summary-text-edit' }, [
            h('textarea', {
              'aria-label': 'Markdown',
              'data-test': 'summary-markdown-textarea',
              value: (props.modelValue as { text?: string }).text ?? '',
              onInput: (event: Event) =>
                emit('update:modelValue', {
                  ...(props.modelValue as object),
                  text: (event.target as HTMLTextAreaElement).value,
                }),
            }),
            h(
              'button',
              {
                'data-test': 'summary-text-save',
                onClick: () => emit('save', props.modelValue),
              },
              'Save Text',
            ),
          ])
        : h('div', 'No text selected')
  },
})

const clickButton = async (wrapper: VueWrapper, text: string) => {
  const button = wrapper.findAll('button').find((candidate) => candidate.text().includes(text))
  expect(button, `button with text "${text}"`).toBeDefined()
  await button!.trigger('click')
}

const setField = async (wrapper: VueWrapper, label: string, value: string) => {
  await wrapper.get(`input[aria-label="${label}"]`).setValue(value)
}

describe('FixturesEdit', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.route.params = {
      seasonId: 'season-1',
      competitionId: 'competition-1',
      id: 'fixture-set-1',
    }
    mocks.fixturesDAO.getDataByPath.mockResolvedValue({
      id: 'fixture-set-1',
      path: 'season/season-1/competition/competition-1/fixtures/fixture-set-1',
      description: 'Week 1',
      date: '2026-01-01',
      start: '20:00',
    })
    mocks.teamDAO.list.mockResolvedValue([
      team('alpha'),
      team('bravo'),
      team('charlie'),
      team('delta'),
      team('echo'),
    ])
    mocks.venueDAO.list.mockResolvedValue([
      venue('alpha-venue'),
      venue('bravo-venue'),
      venue('charlie-venue'),
      venue('delta-venue'),
      venue('echo-venue'),
    ])
    mocks.fixtureDAO.entities.mockResolvedValue([])
    mocks.textDAO.getData.mockResolvedValue(undefined)
    mocks.textDAO.save.mockResolvedValue(undefined)
    mocks.axiosPost.mockResolvedValue({ data: {} })
    let uuidCounter = 0
    mocks.uuid.mockImplementation(() => `uuid-${++uuidCounter}`)
  })

  it('saves a new fixture group with a uuid id and path', async () => {
    mocks.route.params = {
      seasonId: 'season-1',
      competitionId: 'competition-1',
      id: 'new',
    }
    const wrapper = await mountFixturesEdit()

    await setField(wrapper, 'Description', 'Week 2')
    await setField(wrapper, 'Date', '2026-01-08')
    await clickButton(wrapper, 'Save')

    expect(mocks.fixturesDAO.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'uuid-1',
        path: 'season/season-1/competition/competition-1/fixtures/uuid-1',
        description: 'Week 2',
        date: '2026-01-08',
      }),
    )
    expect(mocks.routerPush).toHaveBeenCalledWith('/season/season-1/competition/competition-1')
  })

  it('sets the venue automatically when a home team is selected for a new fixture', async () => {
    const wrapper = await mountFixturesEdit()

    await wrapper.find('[data-test="add-fixture-button"]').trigger('click')
    await wrapper.find<HTMLSelectElement>('[data-test="home-team-select"]').setValue('team/alpha')

    expect(wrapper.find<HTMLSelectElement>('[data-test="venue-select"]').element.value).toBe(
      'venue/alpha-venue',
    )
  })

  it('saves a new fixture using selected team and venue references', async () => {
    const wrapper = await mountFixturesEdit()

    await wrapper.find('[data-test="add-fixture-button"]').trigger('click')
    await wrapper.find<HTMLSelectElement>('[data-test="home-team-select"]').setValue('team/alpha')
    await wrapper.find<HTMLSelectElement>('[data-test="away-team-select"]').setValue('team/bravo')
    await wrapper.find('[data-test="save-fixture-button"]').trigger('click')

    expect(mocks.fixtureDAO.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'uuid-1',
        path: 'season/season-1/competition/competition-1/fixtures/fixture-set-1/fixture/uuid-1',
        home: { id: 'alpha', path: 'team/alpha' },
        away: { id: 'bravo', path: 'team/bravo' },
        venue: { id: 'alpha-venue', path: 'venue/alpha-venue' },
      }),
    )
    const savedFixture = mocks.fixtureDAO.save.mock.calls[0][0]
    expect(savedFixture).not.toHaveProperty('homePath')
    expect(savedFixture).not.toHaveProperty('awayPath')
    expect(savedFixture).not.toHaveProperty('venuePath')
    expect(wrapper.findAll('[data-test="fixture-list-item"]')).toHaveLength(1)
  })

  it('shows only unallocated teams plus the current fixture team in fixture team dropdowns', async () => {
    mocks.fixtureDAO.entities.mockResolvedValue([
      fixture('fixture-1', 'alpha', 'bravo'),
      fixture('fixture-2', 'charlie', 'delta'),
    ])
    const wrapper = await mountFixturesEdit()

    await wrapper.findAll('[data-test="fixture-list-item"]')[0].trigger('click')

    const homeOptions = wrapper
      .find<HTMLSelectElement>('[data-test="home-team-select"]')
      .findAll('option')
      .map((option) => option.element.value)
    const awayOptions = wrapper
      .find<HTMLSelectElement>('[data-test="away-team-select"]')
      .findAll('option')
      .map((option) => option.element.value)

    expect(homeOptions).toEqual(['', 'team/alpha', 'team/echo'])
    expect(awayOptions).toEqual(['', 'team/bravo', 'team/echo'])
  })

  it('allows an existing AI summary to be edited and saved with the fixture group', async () => {
    mocks.fixturesDAO.getDataByPath.mockResolvedValueOnce({
      id: 'fixture-set-1',
      path: 'season/season-1/competition/competition-1/fixtures/fixture-set-1',
      description: 'Week 1',
      date: '2026-01-01',
      start: '20:00',
      resultsSummary: { id: 'summary-text', path: 'text/summary-text' },
    })
    mocks.textDAO.getData.mockResolvedValueOnce({
      id: 'summary-text',
      path: 'text/summary-text',
      text: 'Original summary',
      mimeType: 'text/markdown',
    })
    const wrapper = await mountFixturesEdit()

    await wrapper.get('[data-test="summary-markdown-textarea"]').setValue('Edited summary')
    await clickButton(wrapper, 'Save')

    expect(mocks.textDAO.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'summary-text',
        path: 'text/summary-text',
        text: 'Edited summary',
      }),
    )
    expect(mocks.fixturesDAO.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'fixture-set-1',
        resultsSummary: { id: 'summary-text', path: 'text/summary-text' },
      }),
    )
  })

  it('saves AI summary edits from the normal text editor', async () => {
    mocks.fixturesDAO.getDataByPath.mockResolvedValueOnce({
      id: 'fixture-set-1',
      path: 'season/season-1/competition/competition-1/fixtures/fixture-set-1',
      description: 'Week 1',
      date: '2026-01-01',
      start: '20:00',
      resultsSummary: { id: 'summary-text', path: 'text/summary-text' },
    })
    mocks.textDAO.getData.mockResolvedValueOnce({
      id: 'summary-text',
      path: 'text/summary-text',
      text: 'Original summary',
      mimeType: 'text/markdown',
    })
    const wrapper = await mountFixturesEdit()

    await wrapper.get('[data-test="summary-markdown-textarea"]').setValue('Saved text edit')
    await wrapper.get('[data-test="summary-text-save"]').trigger('click')

    expect(mocks.textDAO.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'summary-text',
        path: 'text/summary-text',
        text: 'Saved text edit',
      }),
    )
    expect(mocks.fixturesDAO.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'fixture-set-1',
        resultsSummary: { id: 'summary-text', path: 'text/summary-text' },
      }),
    )
    expect(wrapper.text()).toContain('AI summary saved')
  })

  it('regenerates the AI summary from the fixture group page', async () => {
    mocks.axiosPost.mockResolvedValue({
      data: {
        resultsSummary: { id: 'summary-text', path: 'text/summary-text' },
        resultsSummaryText: 'Fresh AI summary',
        resultsSummaryGeneratedAt: '2026-05-31T09:00:00.000Z',
        resultsSummaryModel: 'gemini-test',
      },
    })
    const wrapper = await mountFixturesEdit()

    await wrapper.find('[data-test="regenerate-summary-button"]').trigger('click')
    await flushPromises()

    expect(mocks.axiosPost).toHaveBeenCalledWith(
      '/rest/maintain/fixtures/results-summary/regenerate',
      {
        fixtureSetPath: 'season/season-1/competition/competition-1/fixtures/fixture-set-1',
      },
    )
    expect(wrapper.get('[data-test="summary-markdown-textarea"]').element).toHaveProperty(
      'value',
      'Fresh AI summary',
    )
    expect(wrapper.text()).toContain('AI summary regenerated')
  })

  it('reports an error when summary regeneration returns no summary text', async () => {
    mocks.axiosPost.mockResolvedValue({ data: '<!doctype html><html></html>' })
    const wrapper = await mountFixturesEdit()

    await wrapper.find('[data-test="regenerate-summary-button"]').trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('AI summary regeneration failed')
    expect(wrapper.find('[data-test="results-summary-text"]').exists()).toBe(false)
  })
})
