import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
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
  uuid: vi.fn(),
}))

vi.mock('vue-router', () => ({
  useRoute: () => mocks.route,
  useRouter: () => ({ push: mocks.routerPush }),
}))

vi.mock('@/dao/FixturesDAO', () => ({
  default: mocks.fixturesDAO,
  fixtureDAO: mocks.fixtureDAO,
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
      stubs: maintenanceComponentStubs,
    },
  })
  await flushPromises()
  return wrapper
}

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
})
