import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useFixtures } from '../FixturesService'

const mocks = vi.hoisted(() => ({
  firstClassCompetitions: vi.fn(),
  fixtures: vi.fn(),
  fixturesDAO: {
    getByPath: vi.fn(),
  },
  fixtureDAO: {
    entities: vi.fn(),
    subCollection: vi.fn(),
  },
  fixtureIndexDAO: {
    seasonFixtureSetDocuments: vi.fn(),
    seasonUpcomingFixtureSetDocuments: vi.fn(),
    seasonFixtureSetDocumentsForDay: vi.fn(),
  },
}))

vi.mock('../CompetitionService', () => ({
  useCompetitions: () => ({
    firstClassCompetitions: mocks.firstClassCompetitions,
    fixtures: mocks.fixtures,
  }),
}))

vi.mock('@/dao/FixturesDAO', () => ({
  default: mocks.fixturesDAO,
  fixtureDAO: mocks.fixtureDAO,
}))

vi.mock('@/dao/FixtureIndexDAO', () => ({
  default: mocks.fixtureIndexDAO,
}))

const fixturesSet = (id: string, date: string, questionsUrl?: string) => ({
  id,
  date,
  path: `season/season-1/competition/league/fixtures/${id}`,
  questionsUrl,
})

const completedFixture = (id: string) => ({
  id,
  result: { homeScore: 42, awayScore: 38 },
})

const incompleteFixture = (id: string) => ({
  id,
})

describe('FixturesService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.fixturesDAO.getByPath.mockImplementation((path: string) => ({ id: path, path }))
    mocks.fixtureDAO.subCollection.mockImplementation((path: string) => `${path}/fixture`)
    mocks.fixtureDAO.entities.mockResolvedValue([completedFixture('fixture-1')])
    mocks.fixtureIndexDAO.seasonFixtureSetDocuments.mockResolvedValue(undefined)
    mocks.fixtureIndexDAO.seasonUpcomingFixtureSetDocuments.mockResolvedValue(undefined)
    mocks.fixtureIndexDAO.seasonFixtureSetDocumentsForDay.mockResolvedValue(undefined)
  })

  it('returns spent fixtures from the fixture index when the season has been rebuilt', async () => {
    mocks.fixtureIndexDAO.seasonFixtureSetDocuments.mockResolvedValue([
      {
        id: 'season/season-1/competition/league/fixtures/latest',
        path: 'season/season-1/competition/league/fixtures/latest',
      },
    ])

    await expect(useFixtures().spentFixtures('season-1', 1)).resolves.toEqual([
      {
        id: 'season/season-1/competition/league/fixtures/latest',
        path: 'season/season-1/competition/league/fixtures/latest',
      },
    ])
    expect(mocks.fixtureIndexDAO.seasonFixtureSetDocuments).toHaveBeenCalledWith('season-1', 1)
    expect(mocks.firstClassCompetitions).not.toHaveBeenCalled()
  })

  it('returns active fixtures from the fixture index when the season has been rebuilt', async () => {
    mocks.fixtureIndexDAO.seasonUpcomingFixtureSetDocuments.mockResolvedValue([
      {
        id: 'season/season-1/competition/league/fixtures/future-1',
        path: 'season/season-1/competition/league/fixtures/future-1',
      },
    ])

    await expect(useFixtures().activeFixtures('season-1', 1)).resolves.toEqual([
      {
        id: 'season/season-1/competition/league/fixtures/future-1',
        path: 'season/season-1/competition/league/fixtures/future-1',
      },
    ])
    expect(mocks.fixtureIndexDAO.seasonUpcomingFixtureSetDocuments).toHaveBeenCalledWith(
      'season-1',
      1,
    )
    expect(mocks.firstClassCompetitions).not.toHaveBeenCalled()
  })

  it('combines fixture groups from first-class season competitions', async () => {
    mocks.firstClassCompetitions.mockResolvedValue([
      { id: 'league', path: 'season/season-1/competition/league' },
      { id: 'cup', path: 'season/season-1/competition/cup' },
    ])
    mocks.fixtures.mockImplementation(async (competitionPath: string) =>
      competitionPath.endsWith('/league')
        ? [fixturesSet('league-week', '2999-01-01')]
        : [fixturesSet('cup-round', '2999-01-02')],
    )

    await expect(useFixtures().seasonFixtures('season-1')).resolves.toEqual([
      expect.objectContaining({ id: 'league-week' }),
      expect.objectContaining({ id: 'cup-round' }),
    ])
  })

  it('returns future fixtures sorted ascending and mapped to document references', async () => {
    mocks.firstClassCompetitions.mockResolvedValue([{ id: 'league', path: 'competition/league' }])
    mocks.fixtures.mockResolvedValue([
      fixturesSet('past', '2000-01-01'),
      fixturesSet('future-2', '2999-01-10'),
      fixturesSet('future-1', '2999-01-01'),
    ])

    await expect(useFixtures().activeFixtures('season-1', 1)).resolves.toEqual([
      {
        id: 'season/season-1/competition/league/fixtures/future-1',
        path: 'season/season-1/competition/league/fixtures/future-1',
      },
    ])
  })

  it('returns spent fixtures sorted descending and mapped to document references', async () => {
    mocks.firstClassCompetitions.mockResolvedValue([{ id: 'league', path: 'competition/league' }])
    mocks.fixtures.mockResolvedValue([
      fixturesSet('oldest', '1999-01-01'),
      fixturesSet('latest', '2000-01-01'),
      fixturesSet('future', '2999-01-01'),
    ])

    await expect(useFixtures().spentFixtures('season-1', 1)).resolves.toEqual([
      {
        id: 'season/season-1/competition/league/fixtures/latest',
        path: 'season/season-1/competition/league/fixtures/latest',
      },
    ])
  })

  it('skips incomplete fixture sets when returning spent fixtures', async () => {
    mocks.firstClassCompetitions.mockResolvedValue([{ id: 'league', path: 'competition/league' }])
    mocks.fixtures.mockResolvedValue([
      fixturesSet('complete', '2000-01-01'),
      fixturesSet('incomplete', '2000-01-02'),
    ])
    mocks.fixtureDAO.entities.mockImplementation(async (collectionPath: string) =>
      collectionPath.includes('/incomplete/')
        ? [incompleteFixture('fixture-2')]
        : [completedFixture('fixture-1')],
    )

    await expect(useFixtures().spentFixtures('season-1', 1)).resolves.toEqual([
      {
        id: 'season/season-1/competition/league/fixtures/complete',
        path: 'season/season-1/competition/league/fixtures/complete',
      },
    ])
  })

  it('returns all completed fixture sets for the latest day using spentFixturesForDay', async () => {
    mocks.firstClassCompetitions.mockResolvedValue([{ id: 'league', path: 'competition/league' }])
    mocks.fixtures.mockResolvedValue([
      fixturesSet('older-1', '2000-01-01'),
      fixturesSet('latest-div1', '2000-01-08'),
      fixturesSet('latest-div2', '2000-01-08'),
      fixturesSet('future', '2999-01-01'),
    ])

    await expect(useFixtures().spentFixturesForDay('season-1')).resolves.toEqual([
      {
        id: 'season/season-1/competition/league/fixtures/latest-div1',
        path: 'season/season-1/competition/league/fixtures/latest-div1',
      },
      {
        id: 'season/season-1/competition/league/fixtures/latest-div2',
        path: 'season/season-1/competition/league/fixtures/latest-div2',
      },
    ])
  })

  it('returns question paper fixture groups sorted descending', async () => {
    vi.stubEnv('VITE_CURRENT_DATE', '2026-06-04')
    const competition = { id: 'league', path: 'competition/league', name: 'League' }
    mocks.firstClassCompetitions.mockResolvedValue([competition])
    mocks.fixtures.mockResolvedValue([
      fixturesSet('without-paper', '2000-01-02'),
      fixturesSet('old-paper', '2000-01-01', 'https://example.com/old.pdf'),
      fixturesSet('blank-paper', '2000-01-03', ' '),
      fixturesSet('new-paper', '2000-01-04', 'https://example.com/new.pdf'),
    ])

    await expect(useFixtures().questionPapers('season-1')).resolves.toEqual([
      { fixtures: expect.objectContaining({ id: 'new-paper' }), competition },
      { fixtures: expect.objectContaining({ id: 'old-paper' }), competition },
    ])

    vi.unstubAllEnvs()
  })

  it('only returns question papers whose quiz date is at least three weeks old', async () => {
    vi.stubEnv('VITE_CURRENT_DATE', '2026-06-21')
    const competition = { id: 'league', path: 'competition/league', name: 'League' }
    mocks.firstClassCompetitions.mockResolvedValue([competition])
    mocks.fixtures.mockResolvedValue([
      fixturesSet('recent', '2026-06-20', 'https://example.com/recent.pdf'),
      fixturesSet('exactly-three-weeks', '2026-05-31', 'https://example.com/three-weeks.pdf'),
      fixturesSet('older', '2026-05-30', 'https://example.com/older.pdf'),
    ])

    await expect(useFixtures().questionPapers('season-1')).resolves.toEqual([
      { fixtures: expect.objectContaining({ id: 'exactly-three-weeks' }), competition },
      { fixtures: expect.objectContaining({ id: 'older' }), competition },
    ])

    vi.unstubAllEnvs()
  })
})
