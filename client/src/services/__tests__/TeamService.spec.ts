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
    seasonStats: vi.fn(),
  },
  teamDAO: {
    getDataById: vi.fn(),
    list: vi.fn(),
  },
  teamMemberDAO: {
    getDataForTeam: vi.fn(),
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

vi.mock('@/dao/TeamMemberDAO', () => ({
  default: mocks.teamMemberDAO,
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
    mocks.statisticsDAO.seasonStats.mockImplementation((seasonId: string) => `stats/${seasonId}`)
    mocks.teamDAO.getDataById.mockImplementation(async (id: string) => ({
      id,
      shortName: id.toUpperCase(),
    }))
    mocks.teamMemberDAO.getDataForTeam.mockResolvedValue(undefined)
  })

  it('combines league and cup standings for a team', async () => {
    mocks.competitionsService.firstClassCompetitions.mockResolvedValue([
      {
        id: 'league',
        path: 'season/season-1/competition/league',
        name: 'League Championship',
        _name: 'league',
      },
      { id: 'cup', path: 'season/season-1/competition/cup', name: 'Cup', _name: 'cup' },
    ])
    mocks.leagueTableDAO.entities.mockResolvedValue([
      {
        description: 'League Championship Table',
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
      { name: 'League Championship', standing: '2nd' },
      { name: 'Cup', standing: 'Round 2' },
    ])
    expect(mocks.leagueTableDAO.subCollection).toHaveBeenCalledWith(
      'season/season-1/competition/league',
    )
    expect(mocks.competitionsService.fixtures).toHaveBeenCalledWith(
      'season/season-1/competition/cup',
    )
  })

  it('returns no standings when the current season has no league or cup entries', async () => {
    mocks.competitionsService.firstClassCompetitions.mockResolvedValue([])

    await expect(useTeams().standings('alpha')).resolves.toEqual([])
    expect(mocks.leagueTableDAO.entities).not.toHaveBeenCalled()
    expect(mocks.competitionsService.fixtures).not.toHaveBeenCalled()
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
    expect(teams.matchScoresData(stat() as never)).toEqual({
      datasets: [
        expect.objectContaining({
          label: 'For',
          data: [10, 30, 0],
        }),
        expect.objectContaining({
          label: 'Against',
          data: [10, 20, 20],
        }),
      ],
      labels: ['1 Jan', '8 Jan', '15 Jan'],
    })
    expect(teams.cumulativeScoresData(stat() as never)).toEqual({
      datasets: [
        expect.objectContaining({
          label: 'For',
          data: [10, 30, 30],
        }),
        expect.objectContaining({
          label: 'Against',
          data: [10, 20, 40],
        }),
      ],
      labels: ['1 Jan', '8 Jan', '15 Jan'],
    })
    expect(teams.cumulativePointsDifferenceData(stat() as never)).toEqual({
      datasets: [
        expect.objectContaining({
          label: 'Difference',
          data: [0, 10, -10],
        }),
      ],
      labels: ['1 Jan', '8 Jan', '15 Jan'],
    })
  })

  it('builds all-season result type totals across supplied statistics', () => {
    expect(useTeams().allSeasonsResultTypes([stat('season-1'), stat('season-2')] as never)).toEqual(
      {
        datasets: [
          expect.objectContaining({
            data: [2, 2, 2],
          }),
        ],
        labels: ['Won', 'Drawn', 'Lost'],
      },
    )
  })

  it('pads all-seasons position data for missing seasons', async () => {
    await expect(useTeams().allSeasonsPositionData([stat('season-2') as never])).resolves.toEqual({
      datasets: [{ data: [null, 2], lineTension: 0.2 }],
      labels: ['2024/25', '2025/26'],
    })
  })

  it('uses the largest available season team count for position axis bounds', async () => {
    mocks.leagueTableDAO.getDataByPath.mockResolvedValue({
      rows: [{ team: { id: 'alpha' } }, { team: { id: 'bravo' } }],
    })
    mocks.statisticsDAO.entities.mockResolvedValue([
      stat('season-1', 'alpha'),
      stat('season-1', 'bravo'),
      stat('season-1', 'charlie'),
      stat('season-1', 'delta'),
    ])

    await expect(useTeams().teamCount(stat('season-1', 'alpha') as never)).resolves.toBe(4)
    expect(mocks.leagueTableDAO.getDataByPath).toHaveBeenCalledWith(
      'season/season-1/competition/league/leaguetable/main',
    )
    expect(mocks.statisticsDAO.seasonStats).toHaveBeenCalledWith('season-1')
  })

  it('falls back to season statistics when the league table count cannot be loaded', async () => {
    mocks.leagueTableDAO.getDataByPath.mockRejectedValue(new Error('missing table'))
    mocks.statisticsDAO.entities.mockResolvedValue([
      stat('season-1', 'alpha'),
      stat('season-1', 'bravo'),
      stat('season-1', 'charlie'),
      stat('season-1', 'delta'),
    ])

    await expect(useTeams().teamCount(stat('season-1', 'alpha') as never)).resolves.toBe(4)
  })

  it('uses the largest team count across multiple seasons', async () => {
    mocks.leagueTableDAO.getDataByPath
      .mockResolvedValueOnce({
        rows: [{ team: { id: 'alpha' } }, { team: { id: 'bravo' } }],
      })
      .mockResolvedValueOnce({
        rows: [{ team: { id: 'alpha' } }, { team: { id: 'bravo' } }, { team: { id: 'charlie' } }],
      })
    mocks.statisticsDAO.entities
      .mockResolvedValueOnce([stat('season-1', 'alpha')])
      .mockResolvedValueOnce([
        stat('season-2', 'alpha'),
        stat('season-2', 'bravo'),
        stat('season-2', 'charlie'),
        stat('season-2', 'delta'),
      ])

    await expect(
      useTeams().teamCountAllSeasons([
        stat('season-1', 'alpha'),
        stat('season-2', 'alpha'),
      ] as never),
    ).resolves.toBe(4)
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

  it('builds all-season highlights from final league positions and match scores', async () => {
    const week = (pointsFor: number, pointsAgainst: number) => ({
      leaguePosition: 1,
      pointsFor,
      pointsAgainst,
      pointsDifference: pointsFor - pointsAgainst,
      cumuPointsFor: pointsFor,
      cumuPointsAgainst: pointsAgainst,
      cumuPointsDifference: pointsFor - pointsAgainst,
      ignorable: false,
    })
    const stats = [
      {
        ...stat('season-1', 'alpha'),
        seasonStats: {
          ...stat('season-1', 'alpha').seasonStats,
          currentLeaguePosition: 2,
        },
        weekStats: {
          '2025-01-01': week(30, 20),
          '2025-01-08': week(5, 10),
          '2025-01-15': { ...week(100, 0), ignorable: true },
        },
      },
      {
        ...stat('season-2', 'alpha'),
        seasonStats: {
          ...stat('season-2', 'alpha').seasonStats,
          currentLeaguePosition: 4,
        },
        weekStats: {
          '2026-01-01': week(50, 20),
          '2026-01-08': week(0, 25),
        },
      },
    ]

    await expect(useTeams().allSeasonsHighlights(stats as never)).resolves.toEqual([
      { title: 'Highest final league position', value: '2nd', detail: '2024/25' },
      { title: 'Lowest final league position', value: '4th', detail: '2025/26' },
      { title: 'Highest score', value: '50', detail: '50-20, 1 Jan, 2025/26' },
      { title: 'Lowest score', value: '0', detail: '0-25, 8 Jan, 2025/26' },
      { title: 'Biggest margin of victory', value: '30', detail: '50-20, 1 Jan, 2025/26' },
      { title: 'Biggest margin of defeat', value: '25', detail: '0-25, 8 Jan, 2025/26' },
    ])
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

  it('treats zero league positions as missing when building all-season position data', async () => {
    const missingPosition = {
      ...stat('season-1', 'alpha'),
      seasonStats: {
        ...stat('season-1', 'alpha').seasonStats,
        currentLeaguePosition: 0,
      },
    }

    await expect(
      useTeams().multipleTeamsAllSeasonsPositionData([[missingPosition]] as never),
    ).resolves.toEqual({
      datasets: [expect.objectContaining({ label: 'ALPHA', data: [null, null] })],
      labels: ['2024/25', '2025/26'],
    })
  })

  it('builds multi-team all-season average graph data', async () => {
    const stats = [[stat('season-1', 'alpha')], [stat('season-2', 'bravo')]]

    await expect(useTeams().multipleTeamsAllSeasonsAverageData(stats as never)).resolves.toEqual({
      datasets: [
        expect.objectContaining({ label: 'ALPHA', data: [40 / 3, null] }),
        expect.objectContaining({ label: 'BRAVO', data: [null, 40 / 3] }),
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

  it('finds tied all-season head-to-head leaders for wins and losses', async () => {
    const stats = [
      {
        ...stat('season-1', 'alpha'),
        seasonStats: {
          ...stat('season-1', 'alpha').seasonStats,
          headToHead: [
            { team: { id: 'bravo', path: 'team/bravo' }, win: 2, draw: 0, lose: 0 },
            { team: { id: 'charlie', path: 'team/charlie' }, win: 0, draw: 0, lose: 2 },
          ],
        },
      },
      {
        ...stat('season-2', 'alpha'),
        seasonStats: {
          ...stat('season-2', 'alpha').seasonStats,
          headToHead: [
            { team: { id: 'bravo', path: 'team/bravo' }, win: 0, draw: 0, lose: 1 },
            { team: { id: 'charlie', path: 'team/charlie' }, win: 2, draw: 0, lose: 1 },
            { team: { id: 'delta', path: 'team/delta' }, win: 0, draw: 0, lose: 3 },
          ],
        },
      },
    ]

    await expect(useTeams().headToHeadLeaders(stats as never)).resolves.toEqual({
      mostBeaten: [
        { team: 'BRAVO', win: 2, lose: 1 },
        { team: 'CHARLIE', win: 2, lose: 3 },
      ],
      mostLostTo: [
        { team: 'CHARLIE', win: 2, lose: 3 },
        { team: 'DELTA', win: 0, lose: 3 },
      ],
    })
  })

  it('finds the team linked to a user', async () => {
    mocks.teamDAO.list.mockResolvedValue([
      { id: 'alpha', path: 'team/alpha' },
      { id: 'bravo', path: 'team/bravo' },
    ])
    mocks.teamMemberDAO.getDataForTeam.mockImplementation(async (team: { id: string }) => {
      if (team.id === 'alpha') return { users: [{ id: 'user-1', path: 'user/user-1' }] }
      if (team.id === 'bravo') return { users: [{ id: 'user-2', path: 'user/user-2' }] }
      return undefined
    })

    await expect(useTeams().teamForUser('user-2')).resolves.toEqual({
      id: 'bravo',
      path: 'team/bravo',
    })
  })
})
