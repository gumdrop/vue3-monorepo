import { flushPromises, mount } from '@vue/test-utils'
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
    mocks.teamDAO.list.mockResolvedValue([team('alpha'), team('bravo'), team('charlie'), team('delta'), team('echo')])
    mocks.venueDAO.list.mockResolvedValue([
      venue('alpha-venue'),
      venue('bravo-venue'),
      venue('charlie-venue'),
      venue('delta-venue'),
      venue('echo-venue'),
    ])
    mocks.fixtureDAO.entities.mockResolvedValue([])
  })

  it('sets the venue automatically when a home team is selected for a new fixture', async () => {
    const wrapper = await mountFixturesEdit()

    await wrapper.find('[data-test="add-fixture-button"]').trigger('click')
    await wrapper.find<HTMLSelectElement>('[data-test="home-team-select"]').setValue('team/alpha')

    expect(wrapper.find<HTMLSelectElement>('[data-test="venue-select"]').element.value).toBe('venue/alpha-venue')
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
