import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => {
  const firestore = { name: 'test-firestore' }
  const lastSegment = (path: string) => path.split('/').filter(Boolean).at(-1) ?? ''

  const makeDocRef = (path: string) => {
    const ref = {
      type: 'document',
      path,
      id: lastSegment(path),
      withConverter: vi.fn(),
    }
    ref.withConverter.mockImplementation((converter: unknown) => ({ ...ref, converter }))
    return ref
  }

  const makeCollectionRef = (path: string) => {
    const ref = {
      type: 'collection',
      path,
      id: lastSegment(path),
      withConverter: vi.fn(),
    }
    ref.withConverter.mockImplementation((converter: unknown) => ({ ...ref, converter }))
    return ref
  }

  return {
    collection: vi.fn((_: unknown, path: string) => makeCollectionRef(path)),
    doc: vi.fn((_: unknown, path: string) => makeDocRef(path)),
    firestore,
    getDoc: vi.fn(),
    getDocs: vi.fn(),
    limit: vi.fn((value: number) => ({ type: 'limit', value })),
    makeDocRef,
    orderBy: vi.fn((field: string, direction?: string) => ({ type: 'orderBy', field, direction })),
    query: vi.fn((base: unknown, ...constraints: unknown[]) => ({
      type: 'query',
      base,
      constraints,
    })),
    useFirestore: vi.fn(() => firestore),
    where: vi.fn((field: string, operator: string, value: unknown) => ({
      type: 'where',
      field,
      operator,
      value,
    })),
  }
})

vi.mock('firebase/firestore', () => ({
  collection: mocks.collection,
  doc: mocks.doc,
  getDoc: mocks.getDoc,
  getDocs: mocks.getDocs,
  limit: mocks.limit,
  orderBy: mocks.orderBy,
  query: mocks.query,
  where: mocks.where,
}))

vi.mock('vuefire', () => ({
  useFirestore: mocks.useFirestore,
}))

import FixtureIndexDAO from '../FixtureIndexDAO'

const snapshot = <T>(data: T | undefined, path: string) => ({
  data: () => data,
  ref: mocks.makeDocRef(path),
})

const rebuiltStatus = {
  id: 'season-1',
  path: 'fixtureindexstatus/season-1',
  seasonId: 'season-1',
  rebuiltAt: '2026-06-08T09:00:00.000Z',
  fixtureSetCount: 1,
}

const fixtureIndex = {
  id: 'index-1',
  path: 'fixtureindex/index-1',
  seasonId: 'season-1',
  seasonPath: 'season/season-1',
  competitionId: 'league',
  competitionPath: 'season/season-1/competition/league',
  competitionName: 'League',
  firstClass: true,
  fixtureSetPath: 'season/season-1/competition/league/fixtures/week-1',
  fixtureSetDate: '2026-05-31',
  fixtureSetStart: '19:30',
  fixtureSetDescription: 'Week 1',
  teamIds: ['team-a', 'team-b', 'team-c', 'team-d'],
  fixtures: [
    {
      fixturePath: 'season/season-1/competition/league/fixtures/week-1/fixture/fixture-1',
      homeTeamId: 'team-a',
      homeTeamPath: 'team/team-a',
      awayTeamId: 'team-b',
      awayTeamPath: 'team/team-b',
      result: { homeScore: 43, awayScore: 42 },
    },
    {
      fixturePath: 'season/season-1/competition/league/fixtures/week-1/fixture/fixture-2',
      homeTeamId: 'team-c',
      homeTeamPath: 'team/team-c',
      awayTeamId: 'team-d',
      awayTeamPath: 'team/team-d',
      result: { homeScore: 41, awayScore: 40 },
    },
  ],
}

describe('FixtureIndexDAO', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getDoc.mockResolvedValue(snapshot(rebuiltStatus, rebuiltStatus.path))
    mocks.getDocs.mockResolvedValue({
      docs: [snapshot(fixtureIndex, fixtureIndex.path)],
    })
  })

  it('does not query fixture indexes before the season has been rebuilt', async () => {
    mocks.getDoc.mockResolvedValue(snapshot(undefined, rebuiltStatus.path))

    await expect(FixtureIndexDAO.seasonFixtureSetDocuments('season-1')).resolves.toBeUndefined()

    expect(mocks.getDocs).not.toHaveBeenCalled()
  })

  it('maps season fixture indexes to fixture-set document references', async () => {
    await expect(FixtureIndexDAO.seasonFixtureSetDocuments('season-1', 1)).resolves.toEqual([
      expect.objectContaining({ path: fixtureIndex.fixtureSetPath }),
    ])

    expect(mocks.where).toHaveBeenCalledWith('seasonId', '==', 'season-1')
    expect(mocks.where).toHaveBeenCalledWith('firstClass', '==', true)
    expect(mocks.where).toHaveBeenCalledWith('fixtureSetDate', '<=', expect.any(String))
    expect(mocks.orderBy).toHaveBeenCalledWith('fixtureSetDate', 'desc')
    expect(mocks.limit).toHaveBeenCalledWith(1)
  })

  it('maps upcoming season fixture indexes to fixture-set document references', async () => {
    await expect(
      FixtureIndexDAO.seasonUpcomingFixtureSetDocuments('season-1', 1),
    ).resolves.toEqual([expect.objectContaining({ path: fixtureIndex.fixtureSetPath })])

    expect(mocks.where).toHaveBeenCalledWith('seasonId', '==', 'season-1')
    expect(mocks.where).toHaveBeenCalledWith('firstClass', '==', true)
    expect(mocks.where).toHaveBeenCalledWith('fixtureSetDate', '>=', expect.any(String))
    expect(mocks.orderBy).toHaveBeenCalledWith('fixtureSetDate', 'asc')
    expect(mocks.limit).toHaveBeenCalledWith(1)
  })

  it('maps competition fixture indexes to fixture-set document references', async () => {
    await expect(
      FixtureIndexDAO.competitionFixtureSetDocuments('season/season-1/competition/league', 1),
    ).resolves.toEqual([expect.objectContaining({ path: fixtureIndex.fixtureSetPath })])

    expect(mocks.where).toHaveBeenCalledWith(
      'competitionPath',
      '==',
      'season/season-1/competition/league',
    )
  })

  it('maps upcoming competition fixture indexes to fixture-set document references', async () => {
    await expect(
      FixtureIndexDAO.competitionUpcomingFixtureSetDocuments(
        'season/season-1/competition/league',
        1,
      ),
    ).resolves.toEqual([expect.objectContaining({ path: fixtureIndex.fixtureSetPath })])

    expect(mocks.where).toHaveBeenCalledWith('fixtureSetDate', '>=', expect.any(String))
    expect(mocks.orderBy).toHaveBeenCalledWith('fixtureSetDate', 'asc')
    expect(mocks.limit).toHaveBeenCalledWith(1)
  })

  it('does not query competition fixture indexes without a season path', async () => {
    await expect(
      FixtureIndexDAO.competitionFixtureSetDocuments('competition/league', 1),
    ).resolves.toBeUndefined()

    expect(mocks.getDocs).not.toHaveBeenCalled()
  })

  it('maps team fixture indexes to matching fixture document references', async () => {
    await expect(FixtureIndexDAO.teamFixtureDocuments('team-b', 'season-1', 5)).resolves.toEqual([
      expect.objectContaining({ path: fixtureIndex.fixtures[0].fixturePath }),
    ])

    expect(mocks.where).toHaveBeenCalledWith('teamIds', 'array-contains', 'team-b')
  })

  it('maps upcoming team fixture indexes to matching fixture document references', async () => {
    await expect(
      FixtureIndexDAO.teamUpcomingFixtureDocuments('team-b', 'season-1', 5),
    ).resolves.toEqual([expect.objectContaining({ path: fixtureIndex.fixtures[0].fixturePath })])

    expect(mocks.where).toHaveBeenCalledWith('seasonId', '==', 'season-1')
    expect(mocks.where).toHaveBeenCalledWith('firstClass', '==', true)
    expect(mocks.where).toHaveBeenCalledWith('teamIds', 'array-contains', 'team-b')
    expect(mocks.where).toHaveBeenCalledWith('fixtureSetDate', '>=', expect.any(String))
    expect(mocks.orderBy).toHaveBeenCalledWith('fixtureSetDate', 'asc')
    expect(mocks.limit).toHaveBeenCalledWith(5)
  })

  it('skips the limit call when take is Number.MAX_SAFE_INTEGER', async () => {
    await FixtureIndexDAO.teamFixtureDocuments('team-b', 'season-1', Number.MAX_SAFE_INTEGER)

    expect(mocks.limit).not.toHaveBeenCalled()
  })
})
