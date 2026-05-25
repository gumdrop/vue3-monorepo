import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useTeams } from '../TeamService'

const mocks = vi.hoisted(() => ({
  applicationContextDAO: {
    getAppContext: vi.fn(),
  },
  fixtureService: {
    fixtureList: vi.fn(),
  },
  leagueTableDAO: {
    entities: vi.fn(),
    getDataByPath: vi.fn(),
    subCollection: vi.fn(),
  },
  seasonDAO: {
    collection: vi.fn(),
    entities: vi.fn(),
  },
  statisticsDAO: {
    allTeamStats: vi.fn(),
    entities: vi.fn(),
  },
  teamDAO: {
    getDataById: vi.fn(),
    list: vi.fn(),
  },
  competitionsService: {
    firstClassCompetitions: vi.fn(),
    fixtures: vi.fn(),
  },
}))

vi.mock('@/dao/ApplicationContextDAO', () => ({
  default: mocks.applicationContextDAO,
}))

vi.mock('@/dao/LeagueTableDAO', () => ({
  default: mocks.leagueTableDAO,
}))

vi.mock('@/dao/SeasonDAO', () => ({
  default: mocks.seasonDAO,
}))

vi.mock('@/dao/StatisticsDAO', () => ({
  default: mocks.statisticsDAO,
}))

vi.mock('@/dao/TeamDAO', () => ({
  default: mocks.teamDAO,
}))

vi.mock('../CompetitionService', () => ({
  useCompetitions: () => mocks.competitionsService,
}))

vi.mock('../FixtureService', () => ({
  useFixture: () => mocks.fixtureService,
}))

const weekStats = {
  '2025-01-08': {
    leaguePosition: 2,
    pointsFor: 30,
    pointsAgainst: 20,
    pointsDifference: 10,
    cumuPointsFor: 30,
    cumuPointsAgainst: 20,
    cumuPointsDifference: 10,
    ignorable: false,
  },
  '2025-01-01': {
    leaguePosition: 3,
    pointsFor: 10,
    pointsAgainst: 10,
    pointsDifference: 0,
    cumuPointsFor: 10,
    cumuPointsAgainst: 10,
    cumuPointsDifference: 0,
    ignorable: false,
  },
  '2025-01-15': {
    leaguePosition: 1,
    pointsFor: 0,
    pointsAgainst: 20,
    pointsDifference: -20,
    cumuPointsFor: 30,
    cumuPointsAgainst: 40,
    cumuPointsDifference: -10,
    ignorable: false,
  },
  '2025-01-22': {
    leaguePosition: 1,
    pointsFor: 50,
    pointsAgainst: 0,
    pointsDifference: 50,
    cumuPointsFor: 80,
    cumuPointsAgainst: 40,
    cumuPointsDifference: 40,
    ignorable: true,
  },
}

const stat = (seasonId = 'season-1', teamId = 'alpha') => ({
  id: `${teamId}-${seasonId}`,
  path: `statistics/${teamId}-${seasonId}`,
  team: { id: teamId, path: `team/${teamId}` },
  season: { id: seasonId, path: `season/${seasonId}` },
  table: { id: 'main', path: `season/${seasonId}/competition/league/leaguetable/main` },
  seasonStats: {
    currentLeaguePosition: 2,
    runningPointsFor: 40,
    runningPointsAgainst: 30,
    runningPointsDifference: 10,
    headToHead: [],
  },
  weekStats,
})

const seasons = [
  { id: 'season-1', startYear: 2024, endYear: 2025 },
  { id: 'season-2', startYear: 2025, endYear: 2026 },
]

describe('TeamService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.applicationContextDAO.getAppContext.mockResolvedValue({
      currentSeason: { id: 'season-1' },
    })
    mocks.leagueTableDAO.subCollection.mockImplementation((key: string) => `${key}/leaguetable`)
    mocks.seasonDAO.collection.mockReturnValue('season-collection')
    mocks.seasonDAO.entities.mockResolvedValue(seasons)
    mocks.teamDAO.getDataById.mockImplementation(async (id: string) => ({
      id,
      shortName: id.toUpperCase(),
    }))
  })

  it('combines league and cup standings for a team', async () => {
    mocks.competitionsService.firstClassCompetitions.mockResolvedValue([
      { id: 'league', key: 'season/season-1/competition/league', name: 'League', _name: 'league' },
      { id: 'cup', key: 'season/season-1/competition/cup', name: 'Cup', _name: 'cup' },
    ])
    mocks.leagueTableDAO.entities.mockResolvedValue([
      {
        description: 'A',
        rows: [
          { team: { id: 'alpha', path: 'team/alpha' }, position: '2' },
          { team: { id: 'bravo', path: 'team/bravo' }, position: '1' },
        ],
      },
    ])
    mocks.competitionsService.fixtures.mockResolvedValue([
      { id: 'round-1', description: 'Round 1', date: '2025-01-01', path: 'fixtures/round-1' },
      { id: 'round-2', description: 'Round 2', date: '2025-02-01', path: 'fixtures/round-2' },
    ])
    mocks.fixtureService.fixtureList
      .mockResolvedValueOnce([{ home: { id: 'charlie' }, away: { id: 'delta' } }])
      .mockResolvedValueOnce([{ home: { id: 'alpha' }, away: { id: 'delta' } }])

    await expect(useTeams().standings('alpha')).resolves.toEqual([
      { name: 'League A', standing: '2nd' },
      { name: 'Cup', standing: 'Round 2' },
    ])
  })

  it('builds chart datasets from non-ignorable weekly stats in date order', () => {
    const teams = useTeams()

    expect(teams.positionData(stat() as never)).toEqual({
      datasets: [{ data: [3, 2, 1], lineTension: 0.2, yAxisId: 'y' }],
      labels: ['1 Jan', '8 Jan', '15 Jan'],
    })
    expect(teams.singleSeasonResultTypes(stat() as never)).toEqual({
      datasets: [
        expect.objectContaining({
          data: [1, 1, 1],
        }),
      ],
      labels: ['Won', 'Drawn', 'Lost'],
    })
  })

  it('pads all-seasons position data for missing seasons', async () => {
    await expect(useTeams().allSeasonsPositionData([stat('season-2') as never])).resolves.toEqual({
      datasets: [{ data: [null, 2], lineTension: 0.2 }],
      labels: ['2024/25', '2025/26'],
    })
  })

  it('calculates all-seasons averages from non-ignorable fixtures', async () => {
    await expect(useTeams().allSeasonsAverageData([stat('season-1') as never])).resolves.toEqual({
      datasets: [
        expect.objectContaining({
          label: 'Average For',
          data: [40 / 3, null],
        }),
        expect.objectContaining({
          label: 'Average Against',
          data: [30 / 3, null],
        }),
      ],
      labels: ['2024/25', '2025/26'],
    })
  })

  it('sorts every team statistics series by season', async () => {
    mocks.statisticsDAO.allTeamStats.mockImplementation((teamId: string) => `stats/${teamId}`)
    mocks.statisticsDAO.entities
      .mockResolvedValueOnce([stat('season-2', 'alpha'), stat('season-1', 'alpha')])
      .mockResolvedValueOnce([stat('season-1', 'bravo')])

    const stats = await useTeams().allSeasonsMultipleTeamStats(['alpha', 'bravo'])

    expect(stats.map((teamStats) => teamStats.map((entry) => entry.season.id))).toEqual([
      ['season-1', 'season-2'],
      ['season-1'],
    ])
  })

  it('builds multi-team all-season position graph data', async () => {
    const stats = [[stat('season-1', 'alpha')], [stat('season-2', 'bravo')]]

    await expect(useTeams().multipleTeamsAllSeasonsPositionData(stats as never)).resolves.toEqual({
      datasets: [
        expect.objectContaining({ label: 'ALPHA', data: [2, null] }),
        expect.objectContaining({ label: 'BRAVO', data: [null, 2] }),
      ],
      labels: ['2024/25', '2025/26'],
    })
  })

  it('aggregates head-to-head results against opponent teams', async () => {
    const primaryStats = [
      {
        ...stat('season-1', 'alpha'),
        seasonStats: {
          ...stat('season-1', 'alpha').seasonStats,
          headToHead: [
            { team: { id: 'bravo', path: 'team/bravo' }, win: 1, draw: 0, lose: 0 },
            { team: { id: 'bravo', path: 'team/bravo' }, win: 0, draw: 1, lose: 0 },
          ],
        },
      },
    ]
    const opponentStats = [stat('season-1', 'bravo')]

    await expect(
      useTeams().headToHeadResultsData([primaryStats, opponentStats] as never),
    ).resolves.toEqual([{ team: 'BRAVO', win: 1, draw: 1, lose: 0 }])
  })

  it('finds the team linked to a user', async () => {
    mocks.teamDAO.list.mockResolvedValue([
      { id: 'alpha', users: [{ id: 'user-1', path: 'user/user-1' }] },
      { id: 'bravo', users: [{ id: 'user-2', path: 'user/user-2' }] },
    ])

    await expect(useTeams().teamForUser('user-2')).resolves.toEqual({
      id: 'bravo',
      users: [{ id: 'user-2', path: 'user/user-2' }],
    })
  })
})
