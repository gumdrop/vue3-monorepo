import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useCompetitions } from '../CompetitionService'

const mocks = vi.hoisted(() => ({
  competitionDAO: {
    entities: vi.fn(),
    getByPath: vi.fn(),
    nestedCollection: vi.fn(),
  },
  fixturesDAO: {
    entities: vi.fn(),
    getByPath: vi.fn(),
    subCollection: vi.fn(),
  },
  fixtureDAO: {
    entities: vi.fn(),
    subCollection: vi.fn(),
  },
  leagueTableDAO: {
    nestedCollection: vi.fn(),
  },
  resultIndexDAO: {
    competitionFixtureSetDocuments: vi.fn(),
  },
  seasonDAO: {
    getById: vi.fn(),
  },
  textDAO: {
    getData: vi.fn(),
  },
}))

vi.mock('@/dao/CompetitionDAO', () => ({
  default: mocks.competitionDAO,
}))

vi.mock('@/dao/FixturesDAO', () => ({
  default: mocks.fixturesDAO,
  fixtureDAO: mocks.fixtureDAO,
}))

vi.mock('@/dao/LeagueTableDAO', () => ({
  default: mocks.leagueTableDAO,
}))

vi.mock('@/dao/ResultIndexDAO', () => ({
  default: mocks.resultIndexDAO,
}))

vi.mock('@/dao/SeasonDAO', () => ({
  default: mocks.seasonDAO,
}))

vi.mock('@/dao/TextDAO', () => ({
  default: mocks.textDAO,
}))

const completedFixture = (id: string) => ({
  id,
  result: { homeScore: 42, awayScore: 38 },
})

const incompleteFixture = (id: string) => ({
  id,
})

describe('CompetitionService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.seasonDAO.getById.mockImplementation((id: string) => ({ id, path: `season/${id}` }))
    mocks.competitionDAO.nestedCollection.mockReturnValue('competition-collection')
    mocks.fixturesDAO.subCollection.mockImplementation((path: string) => `${path}/fixtures`)
    mocks.fixturesDAO.getByPath.mockImplementation((path: string) => ({ id: path, path }))
    mocks.fixtureDAO.subCollection.mockImplementation((path: string) => `${path}/fixture`)
    mocks.fixtureDAO.entities.mockResolvedValue([completedFixture('fixture-1')])
    mocks.competitionDAO.getByPath.mockImplementation((path: string) => ({ id: path, path }))
    mocks.resultIndexDAO.competitionFixtureSetDocuments.mockResolvedValue(undefined)
    mocks.leagueTableDAO.nestedCollection.mockImplementation((doc) => ({
      parent: doc,
      entity: 'leaguetable',
    }))
  })

  it('loads competitions for a season sorted by display name', async () => {
    mocks.competitionDAO.entities.mockResolvedValue([
      { id: 'cup', name: 'Cup', _name: 'cup' },
      { id: 'league', name: 'League', _name: 'league' },
      { id: 'plate', name: 'Plate', _name: 'cup' },
    ])

    await expect(useCompetitions().competitions('season-1')).resolves.toEqual([
      expect.objectContaining({ id: 'cup' }),
      expect.objectContaining({ id: 'league' }),
      expect.objectContaining({ id: 'plate' }),
    ])
    expect(mocks.competitionDAO.entities).toHaveBeenCalledWith('competition-collection')
  })

  it('filters first-class competitions and competitions by type', async () => {
    mocks.competitionDAO.entities.mockResolvedValue([
      { id: 'subsidiary', name: 'Subsidiary', _name: 'subsidiary' },
      { id: 'league', name: 'League', _name: 'league' },
      { id: 'cup', name: 'Cup', _name: 'cup' },
    ])

    const service = useCompetitions()

    await expect(service.firstClassCompetitions('season-1')).resolves.toEqual([
      expect.objectContaining({ id: 'cup' }),
      expect.objectContaining({ id: 'league' }),
    ])
    await expect(service.competitionOfType('season-1', 'league')).resolves.toEqual(
      expect.objectContaining({ id: 'league' }),
    )
  })

  it('returns future fixtures sorted ascending and mapped to document references', async () => {
    mocks.fixturesDAO.entities.mockResolvedValue([
      { id: 'past', date: '2000-01-01', path: 'competition/league/fixtures/past' },
      { id: 'future-2', date: '2999-01-10', path: 'competition/league/fixtures/future-2' },
      { id: 'future-1', date: '2999-01-01', path: 'competition/league/fixtures/future-1' },
    ])

    await expect(useCompetitions().nextFixtures('competition/league', 1)).resolves.toEqual([
      { id: 'competition/league/fixtures/future-1', path: 'competition/league/fixtures/future-1' },
    ])
  })

  it('returns past results sorted descending and mapped to document references', async () => {
    mocks.fixturesDAO.entities.mockResolvedValue([
      { id: 'oldest', date: '1999-01-01', path: 'competition/league/fixtures/oldest' },
      { id: 'future', date: '2999-01-01', path: 'competition/league/fixtures/future' },
      { id: 'latest', date: '2000-01-01', path: 'competition/league/fixtures/latest' },
    ])

    await expect(useCompetitions().latestResults('competition/league', 1)).resolves.toEqual([
      { id: 'competition/league/fixtures/latest', path: 'competition/league/fixtures/latest' },
    ])
  })

  it('returns past results from the result index when the season has been rebuilt', async () => {
    mocks.resultIndexDAO.competitionFixtureSetDocuments.mockResolvedValue([
      { id: 'competition/league/fixtures/latest', path: 'competition/league/fixtures/latest' },
    ])

    await expect(useCompetitions().latestResults('competition/league', 1)).resolves.toEqual([
      { id: 'competition/league/fixtures/latest', path: 'competition/league/fixtures/latest' },
    ])
    expect(mocks.resultIndexDAO.competitionFixtureSetDocuments).toHaveBeenCalledWith(
      'competition/league',
      1,
    )
    expect(mocks.fixturesDAO.entities).not.toHaveBeenCalled()
  })

  it('skips incomplete fixture sets when returning latest results', async () => {
    mocks.fixturesDAO.entities.mockResolvedValue([
      { id: 'complete', date: '2000-01-01', path: 'competition/league/fixtures/complete' },
      { id: 'incomplete', date: '2000-01-02', path: 'competition/league/fixtures/incomplete' },
    ])
    mocks.fixtureDAO.entities.mockImplementation(async (collectionPath: string) =>
      collectionPath.includes('/incomplete/')
        ? [incompleteFixture('fixture-2')]
        : [completedFixture('fixture-1')],
    )

    await expect(useCompetitions().latestResults('competition/league', 1)).resolves.toEqual([
      { id: 'competition/league/fixtures/complete', path: 'competition/league/fixtures/complete' },
    ])
  })

  it('loads linked roundup text for completed team competitions in the season', async () => {
    const leagueRoundup = {
      id: 'league-roundup',
      path: 'text/league-roundup',
      text: 'League season roundup.',
      mimeType: 'text/markdown',
    }
    const leagueCompetition = {
      id: 'league',
      name: 'League',
      path: 'season/season-1/competition/league',
      _name: 'league',
      roundup: { id: 'league-roundup', path: 'text/league-roundup' },
    }
    const cupCompetition = {
      id: 'cup',
      name: 'Cup',
      path: 'season/season-1/competition/cup',
      _name: 'cup',
      roundup: { id: 'cup-roundup', path: 'text/cup-roundup' },
    }
    const singletonCompetition = {
      id: 'finals',
      name: 'Finals',
      path: 'season/season-1/competition/finals',
      _name: 'singleton',
      roundup: { id: 'finals-roundup', path: 'text/finals-roundup' },
    }
    mocks.competitionDAO.entities.mockResolvedValue([
      singletonCompetition,
      leagueCompetition,
      cupCompetition,
    ])
    mocks.textDAO.getData.mockImplementation(async (textRef: { path: string }) =>
      textRef.path === 'text/league-roundup'
        ? leagueRoundup
        : { id: 'empty', path: textRef.path, text: ' ', mimeType: 'text/markdown' },
    )

    await expect(useCompetitions().roundups('season-1')).resolves.toEqual([
      {
        competition: leagueCompetition,
        text: leagueRoundup,
      },
    ])
    expect(mocks.textDAO.getData).toHaveBeenCalledWith({
      id: 'cup-roundup',
      path: 'text/cup-roundup',
    })
    expect(mocks.textDAO.getData).not.toHaveBeenCalledWith({
      id: 'finals-roundup',
      path: 'text/finals-roundup',
    })
  })

  it('builds league table collections under a competition document', () => {
    expect(useCompetitions().leagueTables('season/season-1/competition/league')).toEqual({
      parent: {
        id: 'season/season-1/competition/league',
        path: 'season/season-1/competition/league',
      },
      entity: 'leaguetable',
    })
  })
})
