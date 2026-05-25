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
  leagueTableDAO: {
    nestedCollection: vi.fn(),
  },
  seasonDAO: {
    getById: vi.fn(),
  },
}))

vi.mock('@/dao/CompetitionDAO', () => ({
  default: mocks.competitionDAO,
}))

vi.mock('@/dao/FixturesDAO', () => ({
  default: mocks.fixturesDAO,
}))

vi.mock('@/dao/LeagueTableDAO', () => ({
  default: mocks.leagueTableDAO,
}))

vi.mock('@/dao/SeasonDAO', () => ({
  default: mocks.seasonDAO,
}))

describe('CompetitionService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.seasonDAO.getById.mockImplementation((id: string) => ({ id, path: `season/${id}` }))
    mocks.competitionDAO.nestedCollection.mockReturnValue('competition-collection')
    mocks.fixturesDAO.subCollection.mockImplementation((path: string) => `${path}/fixtures`)
    mocks.fixturesDAO.getByPath.mockImplementation((path: string) => ({ id: path, path }))
    mocks.competitionDAO.getByPath.mockImplementation((path: string) => ({ id: path, path }))
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
