import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type LeagueTable from '@/entity/LeagueTable'
import type { LeagueTableRow } from '@/entity/LeagueTable'
import type Team from '@/entity/Team'
import LeagueTableEdit from '../LeagueTableEdit.vue'
import { maintenanceComponentStubs } from '@/maintain/__tests__/componentStubs'

const mocks = vi.hoisted(() => ({
  route: {
    params: {
      seasonId: 'season-1',
      competitionId: 'competition-1',
      id: 'main',
    },
  },
  routerPush: vi.fn(),
  leagueTableDAO: {
    getDataByPath: vi.fn(),
    save: vi.fn(),
  },
  teamDAO: {
    list: vi.fn(),
  },
}))

vi.mock('vue-router', () => ({
  useRoute: () => mocks.route,
  useRouter: () => ({ push: mocks.routerPush }),
}))

vi.mock('@/dao/LeagueTableDAO', () => ({
  default: mocks.leagueTableDAO,
}))

vi.mock('@/dao/TeamDAO', () => ({
  default: mocks.teamDAO,
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

const row = (teamId: string, leaguePoints: number, matchPointsFor: number): LeagueTableRow => ({
  team: { id: teamId, path: `team/${teamId}` },
  position: '',
  played: 0,
  won: 0,
  lost: 0,
  drawn: 0,
  leaguePoints,
  matchPointsFor,
  matchPointsAgainst: 0,
})

const mountLeagueTableEdit = async () => {
  const wrapper = mount(LeagueTableEdit, {
    global: {
      stubs: maintenanceComponentStubs,
    },
  })
  await flushPromises()
  return wrapper
}

describe('LeagueTableEdit', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.route.params = {
      seasonId: 'season-1',
      competitionId: 'competition-1',
      id: 'main',
    }
    mocks.teamDAO.list.mockResolvedValue([team('alpha'), team('bravo'), team('charlie')])
    mocks.leagueTableDAO.getDataByPath.mockResolvedValue({
      id: 'main',
      path: 'season/season-1/competition/competition-1/leaguetable/main',
      description: 'Main',
      rows: [row('alpha', 1, 10), row('bravo', 3, 8)],
    } as LeagueTable)
  })

  it('shows only unallocated teams plus the current row team in row dropdowns', async () => {
    const wrapper = await mountLeagueTableEdit()

    const selects = wrapper.findAll<HTMLSelectElement>('[data-test="league-table-team-select"]')
    const firstRowOptions = selects[0].findAll('option').map((option) => option.element.value)
    const secondRowOptions = selects[1].findAll('option').map((option) => option.element.value)

    expect(firstRowOptions).toEqual(['', 'alpha', 'charlie'])
    expect(secondRowOptions).toEqual(['', 'bravo', 'charlie'])
  })

  it('recalculates row positions and saves the normalised table', async () => {
    const wrapper = await mountLeagueTableEdit()

    await wrapper.find('[data-test="recalculate-positions-button"]').trigger('click')
    await wrapper.find('[data-test="save-league-table-button"]').trigger('click')

    expect(mocks.leagueTableDAO.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'main',
        path: 'season/season-1/competition/competition-1/leaguetable/main',
        rows: [
          expect.objectContaining({ team: { id: 'bravo', path: 'team/bravo' }, position: '1' }),
          expect.objectContaining({ team: { id: 'alpha', path: 'team/alpha' }, position: '2' }),
        ],
      }),
    )
  })
})
