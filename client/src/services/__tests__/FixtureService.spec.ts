import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useFixture } from '../FixtureService'

const mocks = vi.hoisted(() => ({
  applicationContextDAO: {
    get: vi.fn(),
    getData: vi.fn(),
  },
  axiosPost: vi.fn(),
  fixtureDAO: {
    entities: vi.fn(),
    getByPath: vi.fn(),
    subCollection: vi.fn(),
  },
  fixturesDAO: {
    entityList: vi.fn(),
  },
  fixturesService: {
    activeFixtures: vi.fn(),
    seasonFixtures: vi.fn(),
    spentFixtures: vi.fn(),
  },
}))

vi.mock('@/dao/ApplicationContextDAO', () => ({
  default: mocks.applicationContextDAO,
}))

vi.mock('@/dao/FixturesDAO', () => ({
  default: mocks.fixturesDAO,
  fixtureDAO: mocks.fixtureDAO,
}))

vi.mock('../FixturesService', () => ({
  useFixtures: () => mocks.fixturesService,
}))

vi.mock('axios', () => ({
  default: {
    post: mocks.axiosPost,
  },
}))

const fixtureGroup = (id: string, date = '2000-01-01') => ({
  id,
  path: `season/season-1/competition/league/fixtures/${id}`,
  date,
  start: '19:30',
})

const fixture = (id: string, homeId: string, awayId: string) => ({
  id,
  path: `season/season-1/competition/league/fixtures/week-1/fixture/${id}`,
  home: { id: homeId, path: `team/${homeId}` },
  away: { id: awayId, path: `team/${awayId}` },
})

describe('FixtureService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.applicationContextDAO.get.mockReturnValue({ path: 'applicationcontext/singleton' })
    mocks.applicationContextDAO.getData.mockResolvedValue({ currentSeason: { id: 'season-1' } })
    mocks.fixtureDAO.subCollection.mockImplementation((path: string) => `${path}/fixture`)
    mocks.fixtureDAO.getByPath.mockImplementation((path: string) => ({ id: path, path }))
  })

  it('flattens fixture groups into their child fixtures', async () => {
    mocks.fixtureDAO.entities
      .mockResolvedValueOnce([fixture('fixture-1', 'alpha', 'bravo')])
      .mockResolvedValueOnce([
        fixture('fixture-2', 'charlie', 'delta'),
        fixture('fixture-3', 'echo', 'foxtrot'),
      ])

    await expect(
      useFixture().fixtureList([fixtureGroup('week-1'), fixtureGroup('week-2')] as never),
    ).resolves.toEqual([
      expect.objectContaining({ id: 'fixture-1' }),
      expect.objectContaining({ id: 'fixture-2' }),
      expect.objectContaining({ id: 'fixture-3' }),
    ])
  })

  it('returns active fixtures for a team in the current season', async () => {
    mocks.fixturesService.activeFixtures.mockResolvedValue(['active-doc'])
    mocks.fixturesDAO.entityList.mockResolvedValue([fixtureGroup('week-1')])
    mocks.fixtureDAO.entities.mockResolvedValue([
      fixture('fixture-1', 'alpha', 'bravo'),
      fixture('fixture-2', 'charlie', 'delta'),
    ])

    await expect(useFixture().teamFixtures('alpha', 1)).resolves.toEqual([
      {
        id: 'season/season-1/competition/league/fixtures/week-1/fixture/fixture-1',
        path: 'season/season-1/competition/league/fixtures/week-1/fixture/fixture-1',
      },
    ])
    expect(mocks.fixturesService.activeFixtures).toHaveBeenCalledWith('season-1')
    expect(mocks.fixturesDAO.entityList).toHaveBeenCalledWith(['active-doc'])
  })

  it('returns spent fixtures for a team in the requested season', async () => {
    mocks.fixturesService.spentFixtures.mockResolvedValue(['spent-doc'])
    mocks.fixturesDAO.entityList.mockResolvedValue([fixtureGroup('week-1')])
    mocks.fixtureDAO.entities.mockResolvedValue([fixture('fixture-1', 'alpha', 'bravo')])

    await useFixture().teamResults('bravo', 'season-2', 1)

    expect(mocks.fixturesService.spentFixtures).toHaveBeenCalledWith('season-2')
  })

  it('returns the latest due fixture for result submission by team', async () => {
    mocks.fixturesService.seasonFixtures.mockResolvedValue([
      fixtureGroup('due', '2000-01-01'),
      fixtureGroup('future', '2999-01-01'),
    ])
    mocks.fixtureDAO.entities.mockResolvedValue([fixture('fixture-1', 'alpha', 'bravo')])

    await expect(useFixture().fixturesForResultSubmission('alpha')).resolves.toEqual([
      {
        id: 'season/season-1/competition/league/fixtures/week-1/fixture/fixture-1',
        path: 'season/season-1/competition/league/fixtures/week-1/fixture/fixture-1',
      },
    ])
    expect(mocks.fixturesService.seasonFixtures).toHaveBeenCalledWith('season-1')
    expect(mocks.fixtureDAO.entities).toHaveBeenCalledTimes(1)
  })

  it('submits result details to the result endpoint', () => {
    const fixturePath = 'season/season-1/competition/league/fixtures/week-1/fixture/fixture-1'
    const result = { homeScore: 3, awayScore: 2 }

    useFixture().submitResult(fixturePath, 'user-1', result, 'Report text')

    expect(mocks.axiosPost).toHaveBeenCalledWith(
      '/rest/site/result/submit',
      {
        fixtures: [
          {
            fixturePath,
            homeScore: 3,
            awayScore: 2,
          },
        ],
        userID: 'user-1',
        reportText: 'Report text',
      },
      { headers: { 'Content-type': 'application/json' } },
    )
  })
})
