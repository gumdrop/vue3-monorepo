import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../App.vue'
import EntitySelect from '../components/EntitySelect.vue'
import HomeView from '../views/HomeView.vue'
import ApplicationContextEdit from '../views/applicationcontext/ApplicationContextEdit.vue'
import GlobalTextEdit from '../views/globaltext/GlobalTextEdit.vue'
import GlobalTextList from '../views/globaltext/GlobalTextList.vue'
import CompetitionEdit from '../views/season/CompetitionEdit.vue'
import SeasonEdit from '../views/season/SeasonEdit.vue'
import SeasonList from '../views/season/SeasonList.vue'
import SiteUserEdit from '../views/siteuser/SiteUserEdit.vue'
import SiteUserList from '../views/siteuser/SiteUserList.vue'
import TeamEdit from '../views/team/TeamEdit.vue'
import TeamList from '../views/team/TeamList.vue'
import UserEdit from '../views/user/UserEdit.vue'
import UserList from '../views/user/UserList.vue'
import VenueEdit from '../views/venue/VenueEdit.vue'
import VenueList from '../views/venue/VenueList.vue'
import { maintenanceComponentStubs } from './componentStubs'

const mocks = vi.hoisted(() => ({
  route: {
    params: {} as Record<string, string>,
  },
  routerPush: vi.fn(),
  applicationContextDAO: {
    getAppContext: vi.fn(),
    save: vi.fn(),
  },
  competitionDAO: {
    entities: vi.fn(),
    getDataByPath: vi.fn(),
    nestedCollection: vi.fn((ref: unknown) => ({ parent: ref, name: 'competition' })),
    save: vi.fn(),
  },
  fixturesDAO: {
    entities: vi.fn(),
    subCollection: vi.fn((path: string) => `${path}/fixtures`),
  },
  globalTextDAO: {
    getDataById: vi.fn(),
    list: vi.fn(),
    save: vi.fn(),
  },
  leagueTableDAO: {
    entities: vi.fn(),
    subCollection: vi.fn((path: string) => `${path}/leaguetable`),
  },
  seasonDAO: {
    getById: vi.fn((id: string) => ({ id, path: `season/${id}` })),
    getDataById: vi.fn(),
    list: vi.fn(),
    save: vi.fn(),
  },
  siteUserDAO: {
    getDataById: vi.fn(),
    list: vi.fn(),
    save: vi.fn(),
  },
  teamDAO: {
    getDataById: vi.fn(),
    list: vi.fn(),
    save: vi.fn(),
  },
  textDAO: {
    getData: vi.fn(),
    getDataByPath: vi.fn(),
    save: vi.fn(),
  },
  userDAO: {
    getDataById: vi.fn(),
    list: vi.fn(),
    save: vi.fn(),
  },
  venueDAO: {
    getDataById: vi.fn(),
    list: vi.fn(),
    save: vi.fn(),
  },
}))

vi.mock('vue-router', () => ({
  useRoute: () => mocks.route,
  useRouter: () => ({ push: mocks.routerPush }),
}))

vi.mock('@/dao/ApplicationContextDAO', () => ({ default: mocks.applicationContextDAO }))
vi.mock('@/dao/CompetitionDAO', () => ({ default: mocks.competitionDAO }))
vi.mock('@/dao/FixturesDAO', () => ({ default: mocks.fixturesDAO }))
vi.mock('@/dao/GlobalTextDAO', () => ({ default: mocks.globalTextDAO }))
vi.mock('@/dao/LeagueTableDAO', () => ({ default: mocks.leagueTableDAO }))
vi.mock('@/dao/SeasonDAO', () => ({ default: mocks.seasonDAO }))
vi.mock('@/dao/SiteUserDAO', () => ({ default: mocks.siteUserDAO }))
vi.mock('@/dao/TeamDAO', () => ({ default: mocks.teamDAO }))
vi.mock('@/dao/TextDAO', () => ({ default: mocks.textDAO }))
vi.mock('@/dao/UserDAO', () => ({ default: mocks.userDAO }))
vi.mock('@/dao/VenueDAO', () => ({ default: mocks.venueDAO }))

type Component = Parameters<typeof mount>[0]

const mountMaintenance = async (component: Component) => {
  const wrapper = mount(component, {
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

const resetDaoMocks = () => {
  mocks.applicationContextDAO.getAppContext.mockResolvedValue(undefined)
  mocks.applicationContextDAO.save.mockResolvedValue(undefined)
  mocks.competitionDAO.entities.mockResolvedValue([])
  mocks.competitionDAO.getDataByPath.mockResolvedValue(undefined)
  mocks.competitionDAO.nestedCollection.mockImplementation((ref: unknown) => ({
    parent: ref,
    name: 'competition',
  }))
  mocks.competitionDAO.save.mockResolvedValue(undefined)
  mocks.fixturesDAO.entities.mockResolvedValue([])
  mocks.fixturesDAO.subCollection.mockImplementation((path: string) => `${path}/fixtures`)
  mocks.globalTextDAO.getDataById.mockResolvedValue(undefined)
  mocks.globalTextDAO.list.mockResolvedValue([])
  mocks.globalTextDAO.save.mockResolvedValue(undefined)
  mocks.leagueTableDAO.entities.mockResolvedValue([])
  mocks.leagueTableDAO.subCollection.mockImplementation((path: string) => `${path}/leaguetable`)
  mocks.seasonDAO.getById.mockImplementation((id: string) => ({ id, path: `season/${id}` }))
  mocks.seasonDAO.getDataById.mockResolvedValue(undefined)
  mocks.seasonDAO.list.mockResolvedValue([])
  mocks.seasonDAO.save.mockResolvedValue(undefined)
  mocks.siteUserDAO.getDataById.mockResolvedValue(undefined)
  mocks.siteUserDAO.list.mockResolvedValue([])
  mocks.siteUserDAO.save.mockResolvedValue(undefined)
  mocks.teamDAO.getDataById.mockResolvedValue(undefined)
  mocks.teamDAO.list.mockResolvedValue([])
  mocks.teamDAO.save.mockResolvedValue(undefined)
  mocks.textDAO.getData.mockResolvedValue(undefined)
  mocks.textDAO.getDataByPath.mockResolvedValue(undefined)
  mocks.textDAO.save.mockResolvedValue(undefined)
  mocks.userDAO.getDataById.mockResolvedValue(undefined)
  mocks.userDAO.list.mockResolvedValue([])
  mocks.userDAO.save.mockResolvedValue(undefined)
  mocks.venueDAO.getDataById.mockResolvedValue(undefined)
  mocks.venueDAO.list.mockResolvedValue([])
  mocks.venueDAO.save.mockResolvedValue(undefined)
}

beforeEach(() => {
  vi.clearAllMocks()
  resetDaoMocks()
  mocks.route.params = {}
  vi.stubGlobal('alert', vi.fn())
})

describe('maintenance shell components', () => {
  it('renders the maintenance menu and toggles the drawer', async () => {
    const wrapper = await mountMaintenance(App)

    expect(wrapper.text()).toContain('Chiltern Quiz League Maintenance')
    expect(wrapper.text()).toContain('Application Context')

    await clickButton(wrapper, 'Menu')

    expect(wrapper.text()).not.toContain('Application Context')
  })

  it('exposes navigation targets for every maintenance area', async () => {
    const wrapper = await mountMaintenance(App)

    const targets = wrapper
      .findAll('button')
      .map((button) => button.attributes('data-to'))
      .filter(Boolean)

    expect(targets).toEqual(
      expect.arrayContaining([
        '/',
        '/season',
        '/team',
        '/venue',
        '/user',
        '/siteuser',
        '/globaltext',
        '/applicationcontext',
      ]),
    )
  })

  it('renders the maintenance home view', async () => {
    const wrapper = await mountMaintenance(HomeView)

    expect(wrapper.text()).toContain('Maintenance Home')
  })

  it('loads entity select options and emits path references', async () => {
    const dao = {
      list: vi.fn().mockResolvedValue([
        { id: 'alpha', path: 'entity/alpha', name: 'Alpha' },
        { id: 'bravo', path: 'entity/bravo', name: 'Bravo' },
      ]),
    }
    const wrapper = mount(EntitySelect, {
      props: {
        dao,
        label: 'Entity',
        modelValue: { id: 'alpha', path: 'entity/alpha' },
      },
      global: {
        stubs: {
          VAutocomplete: maintenanceComponentStubs.VAutocomplete,
        },
      },
    })
    await flushPromises()

    await wrapper.get('select').setValue('bravo')

    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([
      { id: 'bravo', path: 'entity/bravo' },
    ])
  })

  it('clears entity select values and follows model updates', async () => {
    const dao = {
      list: vi.fn().mockResolvedValue([
        { id: 'alpha', path: 'entity/alpha', name: 'Alpha' },
        { id: 'bravo', path: 'entity/bravo', name: 'Bravo' },
      ]),
    }
    const wrapper = mount(EntitySelect, {
      props: {
        dao,
        label: 'Entity',
        modelValue: { id: 'alpha', path: 'entity/alpha' },
      },
      global: {
        stubs: {
          VAutocomplete: maintenanceComponentStubs.VAutocomplete,
        },
      },
    })
    await flushPromises()

    expect(wrapper.get<HTMLSelectElement>('select').element.value).toBe('alpha')

    await wrapper.setProps({ modelValue: { id: 'bravo', path: 'entity/bravo' } })
    await flushPromises()
    expect(wrapper.get<HTMLSelectElement>('select').element.value).toBe('bravo')

    await wrapper.get('select').setValue('')

    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([undefined])
  })
})

describe('maintenance list views', () => {
  it('loads teams and routes to add team', async () => {
    mocks.teamDAO.list.mockResolvedValue([
      { id: 'alpha', path: 'team/alpha', name: 'Alpha', shortName: 'ALP' },
    ])
    const wrapper = await mountMaintenance(TeamList)

    expect(wrapper.text()).toContain('Alpha')
    await clickButton(wrapper, 'Add Team')

    expect(mocks.routerPush).toHaveBeenCalledWith('/team/new')
  })

  it('loads venues and routes to add venue', async () => {
    mocks.venueDAO.list.mockResolvedValue([
      { id: 'town-hall', path: 'venue/town-hall', name: 'Town Hall', address: 'High Street' },
    ])
    const wrapper = await mountMaintenance(VenueList)

    expect(wrapper.text()).toContain('Town Hall')
    await clickButton(wrapper, 'Add Venue')

    expect(mocks.routerPush).toHaveBeenCalledWith('/venue/new')
  })

  it('loads users and routes to add user', async () => {
    mocks.userDAO.list.mockResolvedValue([
      { id: 'user-1', path: 'user/user-1', name: 'Alice User', email: 'alice@example.com' },
    ])
    const wrapper = await mountMaintenance(UserList)

    expect(wrapper.text()).toContain('Alice User')
    await clickButton(wrapper, 'Add User')

    expect(mocks.routerPush).toHaveBeenCalledWith('/user/new')
  })

  it('loads site users and routes to add site user', async () => {
    mocks.siteUserDAO.list.mockResolvedValue([
      { id: 'alice', path: 'siteuser/alice', handle: 'alice' },
    ])
    const wrapper = await mountMaintenance(SiteUserList)

    expect(wrapper.text()).toContain('alice')
    await clickButton(wrapper, 'Add Site User')

    expect(mocks.routerPush).toHaveBeenCalledWith('/siteuser/new')
  })

  it('loads global text entries and routes to add global text', async () => {
    mocks.globalTextDAO.list.mockResolvedValue([
      { id: 'rules', path: 'globaltext/rules', name: 'Rules' },
    ])
    const wrapper = await mountMaintenance(GlobalTextList)

    expect(wrapper.text()).toContain('Rules')
    await clickButton(wrapper, 'Add Global Text')

    expect(mocks.routerPush).toHaveBeenCalledWith('/globaltext/new')
  })

  it('loads seasons sorted by start year and routes to add season', async () => {
    mocks.seasonDAO.list.mockResolvedValue([
      { id: '2024-2025', path: 'season/2024-2025', startYear: 2024, endYear: 2025 },
      { id: '2025-2026', path: 'season/2025-2026', startYear: 2025, endYear: 2026 },
    ])
    const wrapper = await mountMaintenance(SeasonList)

    expect(wrapper.text().indexOf('2025/2026')).toBeLessThan(wrapper.text().indexOf('2024/2025'))
    await clickButton(wrapper, 'Add Season')

    expect(mocks.routerPush).toHaveBeenCalledWith('/season/new')
  })
})

describe('maintenance edit views', () => {
  it('saves a new team with a generated id and path', async () => {
    mocks.route.params = { id: 'new' }
    const wrapper = await mountMaintenance(TeamEdit)

    expect(wrapper.find('input[aria-label="Email"]').exists()).toBe(false)
    await setField(wrapper, 'Name', 'Quiz Masters')
    await setField(wrapper, 'Short Name', 'QM')
    await setField(wrapper, 'Handle', 'quizmasters')
    await clickButton(wrapper, 'Save')

    expect(mocks.teamDAO.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'quiz-masters',
        path: 'team/quiz-masters',
        name: 'Quiz Masters',
        shortName: 'QM',
        handle: 'quizmasters',
      }),
    )
    expect(mocks.routerPush).toHaveBeenCalledWith('/team')
  })

  it('loads and saves an existing team without regenerating its identity', async () => {
    mocks.route.params = { id: 'alpha' }
    mocks.teamDAO.getDataById.mockResolvedValue({
      id: 'alpha',
      path: 'team/alpha',
      name: 'Alpha',
      shortName: 'ALP',
      handle: 'alpha',
      email: 'alpha@example.com',
      retired: false,
      users: [],
      text: { id: 'alpha-text', path: 'text/alpha-text' },
      venue: { id: 'alpha-venue', path: 'venue/alpha-venue' },
    })
    const wrapper = await mountMaintenance(TeamEdit)

    await setField(wrapper, 'Name', 'Alpha Updated')
    await setField(wrapper, 'Handle', 'alpha-updated')
    await clickButton(wrapper, 'Save')

    expect(mocks.teamDAO.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'alpha',
        path: 'team/alpha',
        name: 'Alpha Updated',
        handle: 'alpha-updated',
      }),
    )
    expect(mocks.teamDAO.save.mock.calls[0]?.[0]).not.toHaveProperty('email')
    expect(mocks.routerPush).toHaveBeenCalledWith('/team')
  })

  it('edits an existing team user list', async () => {
    mocks.route.params = { id: 'alpha' }
    mocks.teamDAO.getDataById.mockResolvedValue({
      id: 'alpha',
      path: 'team/alpha',
      name: 'Alpha',
      shortName: 'ALP',
      retired: false,
      users: [{ id: 'alice', path: 'user/alice' }],
      text: undefined,
      venue: { id: 'alpha-venue', path: 'venue/alpha-venue' },
    })
    mocks.userDAO.list.mockResolvedValue([
      { id: 'alice', path: 'user/alice', name: 'Alice User', email: 'alice@example.com' },
      { id: 'bob', path: 'user/bob', name: 'Bob User', email: 'bob@example.com' },
    ])
    const wrapper = await mountMaintenance(TeamEdit)

    expect(wrapper.text()).toContain('Alice User')
    expect(wrapper.get('[data-test="remove-user-alice"]').text()).toContain('Alice User')

    await wrapper.get('select[data-test="team-user-select"]').setValue('bob')
    await clickButton(wrapper, 'Add User')
    await wrapper.get('[data-test="remove-user-alice-close"]').trigger('click')
    await clickButton(wrapper, 'Save')

    expect(mocks.teamDAO.save).toHaveBeenCalledWith(
      expect.objectContaining({
        users: [{ id: 'bob', path: 'user/bob' }],
      }),
    )
  })

  it('loads and saves linked team text', async () => {
    mocks.route.params = { id: 'alpha' }
    mocks.teamDAO.getDataById.mockResolvedValue({
      id: 'alpha',
      path: 'team/alpha',
      name: 'Alpha',
      shortName: 'ALP',
      retired: false,
      users: [],
      text: { id: 'alpha-text', path: 'text/alpha-text' },
      venue: { id: 'alpha-venue', path: 'venue/alpha-venue' },
    })
    mocks.textDAO.getData.mockResolvedValue({
      id: 'alpha-text',
      path: 'text/alpha-text',
      text: 'Alpha team notes',
      mimeType: 'text/html',
    })
    const wrapper = await mountMaintenance(TeamEdit)

    expect(mocks.textDAO.getData).toHaveBeenCalledWith({
      id: 'alpha-text',
      path: 'text/alpha-text',
    })

    await clickButton(wrapper, 'Save Text')

    expect(mocks.textDAO.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'alpha-text',
        path: 'text/alpha-text',
        text: 'Alpha team notes',
      }),
    )
  })

  it('adds text to an existing team', async () => {
    mocks.route.params = { id: 'alpha' }
    mocks.teamDAO.getDataById.mockResolvedValue({
      id: 'alpha',
      path: 'team/alpha',
      name: 'Alpha',
      shortName: 'ALP',
      retired: false,
      users: [],
      text: undefined,
      venue: { id: 'alpha-venue', path: 'venue/alpha-venue' },
    })
    const wrapper = await mountMaintenance(TeamEdit)

    await clickButton(wrapper, 'Add Text')

    expect(mocks.textDAO.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'alpha-text',
        path: 'text/alpha-text',
        text: '',
        mimeType: 'text/html',
      }),
    )
    expect(mocks.teamDAO.save).toHaveBeenCalledWith(
      expect.objectContaining({
        text: { id: 'alpha-text', path: 'text/alpha-text' },
      }),
    )
  })

  it('saves a new venue with a generated id and path', async () => {
    mocks.route.params = { id: 'new' }
    const wrapper = await mountMaintenance(VenueEdit)

    expect(wrapper.find('input[aria-label="Post Code"]').exists()).toBe(false)

    await setField(wrapper, 'Name', 'Town Hall')
    await setField(wrapper, 'Address', 'High Street')
    await clickButton(wrapper, 'Save')

    const savedVenue = mocks.venueDAO.save.mock.calls[0][0]
    expect(savedVenue).not.toHaveProperty('postCode')
    expect(savedVenue).toEqual(
      expect.objectContaining({
        id: 'town-hall',
        path: 'venue/town-hall',
        name: 'Town Hall',
        address: 'High Street',
      }),
    )
    expect(mocks.routerPush).toHaveBeenCalledWith('/venue')
  })

  it('loads and saves an existing venue without regenerating its identity', async () => {
    mocks.route.params = { id: 'town-hall' }
    mocks.venueDAO.getDataById.mockResolvedValue({
      id: 'town-hall',
      path: 'venue/town-hall',
      name: 'Town Hall',
      address: 'High Street',
      postCode: 'HP1 1AA',
      retired: false,
    })
    const wrapper = await mountMaintenance(VenueEdit)

    expect(wrapper.find('input[aria-label="Post Code"]').exists()).toBe(false)

    await setField(wrapper, 'Address', 'New Road')
    await clickButton(wrapper, 'Save')

    const savedVenue = mocks.venueDAO.save.mock.calls[0][0]
    expect(savedVenue).not.toHaveProperty('postCode')
    expect(savedVenue).toEqual(
      expect.objectContaining({
        id: 'town-hall',
        path: 'venue/town-hall',
        address: 'New Road',
      }),
    )
    expect(mocks.routerPush).toHaveBeenCalledWith('/venue')
  })

  it('saves a new user with an email-derived id and path', async () => {
    mocks.route.params = { id: 'new' }
    const wrapper = await mountMaintenance(UserEdit)

    await setField(wrapper, 'Name', 'Alice User')
    await setField(wrapper, 'Email', 'alice@example.com')
    await clickButton(wrapper, 'Save')

    expect(mocks.userDAO.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'alice_example_com',
        path: 'user/alice_example_com',
        name: 'Alice User',
        email: 'alice@example.com',
      }),
    )
    expect(mocks.routerPush).toHaveBeenCalledWith('/user')
  })

  it('loads and saves an existing user without regenerating its identity', async () => {
    mocks.route.params = { id: 'alice_example_com' }
    mocks.userDAO.getDataById.mockResolvedValue({
      id: 'alice_example_com',
      path: 'user/alice_example_com',
      name: 'Alice User',
      email: 'alice@example.com',
    })
    const wrapper = await mountMaintenance(UserEdit)

    await setField(wrapper, 'Name', 'Alice Updated')
    await clickButton(wrapper, 'Save')

    expect(mocks.userDAO.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'alice_example_com',
        path: 'user/alice_example_com',
        name: 'Alice Updated',
      }),
    )
    expect(mocks.routerPush).toHaveBeenCalledWith('/user')
  })

  it('saves a new site user with a handle-derived id and path', async () => {
    mocks.route.params = { id: 'new' }
    const wrapper = await mountMaintenance(SiteUserEdit)

    await setField(wrapper, 'Handle', 'Alice Admin')
    await setField(wrapper, 'Email', 'alice@example.com')
    await clickButton(wrapper, 'Save')

    expect(mocks.siteUserDAO.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'alice-admin',
        path: 'siteuser/alice-admin',
        handle: 'Alice Admin',
        email: 'alice@example.com',
      }),
    )
    expect(mocks.routerPush).toHaveBeenCalledWith('/siteuser')
  })

  it('loads and saves an existing site user without regenerating its identity', async () => {
    mocks.route.params = { id: 'alice-admin' }
    mocks.siteUserDAO.getDataById.mockResolvedValue({
      id: 'alice-admin',
      path: 'siteuser/alice-admin',
      handle: 'Alice Admin',
      email: 'alice@example.com',
      uid: 'firebase-uid',
      avatar: '',
      user: { id: 'alice_example_com', path: 'user/alice_example_com' },
    })
    const wrapper = await mountMaintenance(SiteUserEdit)

    await setField(wrapper, 'Firebase UID', 'new-uid')
    await clickButton(wrapper, 'Save')

    expect(mocks.siteUserDAO.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'alice-admin',
        path: 'siteuser/alice-admin',
        uid: 'new-uid',
      }),
    )
    expect(mocks.routerPush).toHaveBeenCalledWith('/siteuser')
  })

  it('saves a new global text entry with editable text references', async () => {
    mocks.route.params = { id: 'new' }
    const wrapper = await mountMaintenance(GlobalTextEdit)

    expect(wrapper.find('[data-test="text-edit-save"]').exists()).toBe(false)
    expect(wrapper.find('[data-test="text-editor-dialog"]').exists()).toBe(false)

    await setField(wrapper, 'Name', 'Rules')
    await clickButton(wrapper, 'Add Text Reference')
    await wrapper.get('input[data-test="global-text-name-0"]').setValue('rules-content')
    expect(wrapper.find('input[data-test="global-text-id-0"]').exists()).toBe(false)
    await clickButton(wrapper, 'Save')

    expect(mocks.textDAO.save).not.toHaveBeenCalled()
    expect(mocks.globalTextDAO.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'rules',
        path: 'globaltext/rules',
        text: { 'rules-content': { id: 'text-rules-content', path: 'text/text-rules-content' } },
      }),
    )
    expect(mocks.routerPush).toHaveBeenCalledWith('/globaltext')
  })

  it('loads global text reference rows and shows the text editor for a selected row', async () => {
    mocks.route.params = { id: 'rules' }
    mocks.globalTextDAO.getDataById.mockResolvedValue({
      id: 'rules',
      path: 'globaltext/rules',
      name: 'Rules',
      text: {
        'front-page': { id: 'front-page-text', path: 'text/front-page-text' },
        'rules-content': { id: 'rules-text', path: 'text/rules-text' },
      },
    })
    mocks.textDAO.getData.mockResolvedValue({
      id: 'rules-text',
      path: 'text/rules-text',
      text: 'Old rules',
      mimeType: 'text/plain',
    })
    const wrapper = await mountMaintenance(GlobalTextEdit)

    expect(wrapper.find('[data-test="text-edit-save"]').exists()).toBe(false)
    expect(wrapper.find('[data-test="text-editor-dialog"]').exists()).toBe(false)
    expect(
      wrapper.get<HTMLInputElement>('input[data-test="global-text-name-0"]').element.value,
    ).toBe('front-page')
    expect(wrapper.find('input[data-test="global-text-id-0"]').exists()).toBe(false)

    await wrapper.get('input[data-test="global-text-name-1"]').setValue('rules-page')
    await wrapper.get('button[data-test="edit-text-1"]').trigger('click')
    await flushPromises()

    expect(mocks.textDAO.getData).toHaveBeenCalledWith({
      id: 'rules-text',
      path: 'text/rules-text',
    })
    expect(wrapper.find('[data-test="text-edit-save"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="text-editor-dialog"]').exists()).toBe(true)

    await clickButton(wrapper, 'Save Text')
    await flushPromises()

    expect(wrapper.find('[data-test="text-edit-save"]').exists()).toBe(false)
    expect(wrapper.find('[data-test="text-editor-dialog"]').exists()).toBe(false)

    await clickButton(wrapper, 'Save')

    expect(mocks.textDAO.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'rules-text',
        path: 'text/rules-text',
        text: 'Old rules',
        mimeType: 'text/plain',
      }),
    )
    expect(mocks.globalTextDAO.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'rules',
        path: 'globaltext/rules',
        text: {
          'front-page': { id: 'front-page-text', path: 'text/front-page-text' },
          'rules-page': { id: 'rules-text', path: 'text/rules-text' },
        },
      }),
    )
    expect(mocks.routerPush).toHaveBeenCalledWith('/globaltext')
  })

  it('saves a new season with a generated season id and path', async () => {
    mocks.route.params = { id: 'new' }
    const wrapper = await mountMaintenance(SeasonEdit)

    await setField(wrapper, 'Start Year', '2026')
    await setField(wrapper, 'End Year', '2027')
    await clickButton(wrapper, 'Save')

    expect(mocks.seasonDAO.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: '2026-2027',
        path: 'season/2026-2027',
        startYear: 2026,
        endYear: 2027,
      }),
    )
    expect(mocks.routerPush).toHaveBeenCalledWith('/season')
  })

  it('adds text to an existing season', async () => {
    mocks.route.params = { id: '2026-2027' }
    mocks.seasonDAO.getDataById.mockResolvedValue({
      id: '2026-2027',
      path: 'season/2026-2027',
      startYear: 2026,
      endYear: 2027,
      text: undefined,
    })
    mocks.competitionDAO.entities.mockResolvedValue([])
    const wrapper = await mountMaintenance(SeasonEdit)

    await clickButton(wrapper, 'Add Text')

    expect(mocks.textDAO.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: '2026-2027-text',
        path: 'text/2026-2027-text',
        text: '',
      }),
    )
    expect(mocks.seasonDAO.save).toHaveBeenCalledWith(
      expect.objectContaining({
        text: { id: '2026-2027-text', path: 'text/2026-2027-text' },
      }),
    )
  })

  it('loads existing season text and routes to competition editors', async () => {
    mocks.route.params = { id: '2026-2027' }
    mocks.seasonDAO.getDataById.mockResolvedValue({
      id: '2026-2027',
      path: 'season/2026-2027',
      startYear: 2026,
      endYear: 2027,
      text: { id: 'season-text', path: 'text/season-text' },
    })
    mocks.textDAO.getDataByPath.mockResolvedValue({
      id: 'season-text',
      path: 'text/season-text',
      text: 'Season notes',
    })
    mocks.competitionDAO.entities.mockResolvedValue([
      {
        id: 'league',
        path: 'season/2026-2027/competition/league',
        name: 'League',
        _name: 'league',
      },
    ])
    const wrapper = await mountMaintenance(SeasonEdit)

    await clickButton(wrapper, 'Save Text')
    expect(mocks.textDAO.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'season-text',
        text: 'Season notes',
      }),
    )

    await clickButton(wrapper, 'Add Competition')
    expect(mocks.routerPush).toHaveBeenLastCalledWith('/season/2026-2027/competition/new')

    await clickButton(wrapper, 'League')
    expect(mocks.routerPush).toHaveBeenLastCalledWith('/season/2026-2027/competition/league')
  })

  it('loads existing competition child collections and routes to child editors', async () => {
    mocks.route.params = { seasonId: '2026-2027', id: 'league' }
    mocks.competitionDAO.getDataByPath.mockResolvedValue({
      id: 'league',
      path: 'season/2026-2027/competition/league',
      name: 'League',
      _name: 'league',
      duration: 1,
    })
    mocks.fixturesDAO.entities.mockResolvedValue([
      { id: 'round-2', path: 'fixtures/round-2', description: 'Round 2', date: '2026-10-15' },
      { id: 'round-1', path: 'fixtures/round-1', description: 'Round 1', date: '2026-10-08' },
    ])
    mocks.leagueTableDAO.entities.mockResolvedValue([
      { id: 'main', path: 'leaguetable/main', description: 'Main' },
    ])
    const wrapper = await mountMaintenance(CompetitionEdit)

    expect(wrapper.text().indexOf('Round 1')).toBeLessThan(wrapper.text().indexOf('Round 2'))

    await clickButton(wrapper, 'Round 1')
    expect(mocks.routerPush).toHaveBeenLastCalledWith(
      '/season/2026-2027/competition/league/fixtures/round-1',
    )

    await clickButton(wrapper, 'Main')
    expect(mocks.routerPush).toHaveBeenLastCalledWith(
      '/season/2026-2027/competition/league/leaguetable/main',
    )

    await clickButton(wrapper, 'Add Fixtures')
    expect(mocks.routerPush).toHaveBeenLastCalledWith(
      '/season/2026-2027/competition/league/fixtures/new',
    )

    await clickButton(wrapper, 'Add Table')
    expect(mocks.routerPush).toHaveBeenLastCalledWith(
      '/season/2026-2027/competition/league/leaguetable/new',
    )
  })

  it('loads and saves linked competition text', async () => {
    mocks.route.params = { seasonId: '2026-2027', id: 'league' }
    mocks.competitionDAO.getDataByPath.mockResolvedValue({
      id: 'league',
      path: 'season/2026-2027/competition/league',
      name: 'League',
      _name: 'league',
      duration: 1,
      text: { id: 'league-text', path: 'text/league-text' },
    })
    mocks.textDAO.getData.mockResolvedValue({
      id: 'league-text',
      path: 'text/league-text',
      text: 'League notes',
      mimeType: 'text/html',
    })
    const wrapper = await mountMaintenance(CompetitionEdit)

    expect(mocks.textDAO.getData).toHaveBeenCalledWith({
      id: 'league-text',
      path: 'text/league-text',
    })

    await clickButton(wrapper, 'Save Text')

    expect(mocks.textDAO.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'league-text',
        path: 'text/league-text',
        text: 'League notes',
      }),
    )
  })

  it('adds text to an existing competition', async () => {
    mocks.route.params = { seasonId: '2026-2027', id: 'league' }
    mocks.competitionDAO.getDataByPath.mockResolvedValue({
      id: 'league',
      path: 'season/2026-2027/competition/league',
      name: 'League',
      _name: 'league',
      duration: 1,
      text: undefined,
    })
    const wrapper = await mountMaintenance(CompetitionEdit)

    await clickButton(wrapper, 'Add Text')

    expect(mocks.textDAO.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: '2026-2027-league-text',
        path: 'text/2026-2027-league-text',
        text: '',
        mimeType: 'text/html',
      }),
    )
    expect(mocks.competitionDAO.save).toHaveBeenCalledWith(
      expect.objectContaining({
        text: { id: '2026-2027-league-text', path: 'text/2026-2027-league-text' },
      }),
    )
  })

  it('saves a new competition with a generated id and path', async () => {
    mocks.route.params = { seasonId: '2026-2027', id: 'new' }
    const wrapper = await mountMaintenance(CompetitionEdit)

    await setField(wrapper, 'Name', 'Knockout Cup')
    await setField(wrapper, 'Text Name', 'knockout-cup-text')
    await setField(wrapper, 'Icon', 'mdi-trophy')

    expect(wrapper.get('[data-test="Icon-append-inner-icon"]').text()).toBe('mdi-trophy')

    await clickButton(wrapper, 'Save')

    expect(mocks.competitionDAO.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'knockout-cup',
        path: 'season/2026-2027/competition/knockout-cup',
        name: 'Knockout Cup',
        textName: 'knockout-cup-text',
        icon: 'mdi-trophy',
      }),
    )
    expect(mocks.routerPush).toHaveBeenCalledWith('/season/2026-2027')
  })

  it('saves the application context and shows confirmation', async () => {
    mocks.applicationContextDAO.getAppContext.mockResolvedValue({
      id: 'applicationcontext',
      path: 'applicationcontext/applicationcontext',
      leagueName: 'Chiltern Quiz League',
      senderEmail: 'sender@example.com',
      cloudStoreBucket: 'bucket',
    })
    const wrapper = await mountMaintenance(ApplicationContextEdit)

    await setField(wrapper, 'League Name', 'Updated League')
    await clickButton(wrapper, 'Save')

    expect(mocks.applicationContextDAO.save).toHaveBeenCalledWith(
      expect.objectContaining({
        leagueName: 'Updated League',
      }),
    )
    expect(alert).toHaveBeenCalledWith('Saved')
  })
})
