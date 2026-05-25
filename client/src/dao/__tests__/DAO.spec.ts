import { beforeEach, describe, expect, it, vi } from 'vitest'
import { SINGLETON_ID, toPath } from '@quizleague/shared'

import type Entity from '@/entity/Entity'
import DAO from '../DAO'
import ApplicationContextDAO from '../ApplicationContextDAO'
import FixturesDAO, { fixtureDAO, reportDAO } from '../FixturesDAO'
import { GenericConverter } from '../GenericConverter'
import SiteUserDAO from '../SiteUserDAO'
import StatisticsDAO from '../StatisticsDAO'
import UserDAO from '../UserDAO'

const mocks = vi.hoisted(() => {
  const firestore = { name: 'test-firestore' }
  const lastSegment = (path: string) => path.split('/').filter(Boolean).at(-1) ?? ''

  const makeDocRef = (path: string) => {
    const ref = {
      type: 'document',
      path,
      id: lastSegment(path),
      _path: { canonicalString: () => path },
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
    deleteDoc: vi.fn(),
    doc: vi.fn((_: unknown, path: string) => makeDocRef(path)),
    firestore,
    getDoc: vi.fn(),
    getDocs: vi.fn(),
    makeCollectionRef,
    makeDocRef,
    orderBy: vi.fn((field: string) => ({ type: 'orderBy', field })),
    query: vi.fn((base: unknown, ...constraints: unknown[]) => ({
      type: 'query',
      base,
      constraints,
    })),
    setDoc: vi.fn(),
    updateDoc: vi.fn(),
    useFirestore: vi.fn(() => firestore),
    uuid: vi.fn(() => 'generated-user-id'),
    where: vi.fn((field: string, operator: string, value: unknown) => ({
      type: 'where',
      field,
      operator,
      value,
    })),
  }
})

vi.mock('firebase/firestore', () => ({
  CollectionReference: class CollectionReference {},
  DocumentReference: class DocumentReference {},
  Query: class Query {},
  collection: mocks.collection,
  deleteDoc: mocks.deleteDoc,
  doc: mocks.doc,
  getDoc: mocks.getDoc,
  getDocs: mocks.getDocs,
  orderBy: mocks.orderBy,
  query: mocks.query,
  setDoc: mocks.setDoc,
  updateDoc: mocks.updateDoc,
  where: mocks.where,
}))

vi.mock('vuefire', () => ({
  useFirestore: mocks.useFirestore,
}))

vi.mock('uuid', () => ({
  v4: mocks.uuid,
}))

interface TestEntity extends Entity {
  id: string
  name: string
  path: string
  retired?: boolean
}

class TestDAO extends DAO<TestEntity> {
  constructor() {
    super('testentity')
  }
}

const snapshot = <T>(data: T | undefined, path = 'testentity/entity-1') => ({
  data: () => data,
  ref: mocks.makeDocRef(path),
})

const legacyRef = (typeName: string, id: string, parentKey = '') => ({
  typeName,
  id,
  key: {
    parentKey,
    entityName: typeName,
    id,
  },
})

describe('DAO', () => {
  let dao: TestDAO

  beforeEach(() => {
    dao = new TestDAO()
    vi.clearAllMocks()
    mocks.getDoc.mockReset()
    mocks.getDocs.mockReset()
    mocks.setDoc.mockReset()
    mocks.updateDoc.mockReset()
    mocks.deleteDoc.mockReset()
    mocks.uuid.mockReturnValue('generated-user-id')
  })

  it('creates converted document and collection references from ids and paths', () => {
    const byId = dao.getById('alpha')
    const byPath = dao.getByPath({ id: 'bravo', path: 'testentity/bravo' })
    const collection = dao.collection()
    const nested = dao.subCollection('season/2025')

    expect(byId.path).toBe('testentity/alpha')
    expect(byId.converter).toBe(dao.converter)
    expect(byPath.path).toBe('testentity/bravo')
    expect(collection.path).toBe('testentity')
    expect(collection.converter).toBe(dao.converter)
    expect(nested.path).toBe('season/2025/testentity')
  })

  it('builds active sorted queries', () => {
    const active = dao.sortedActive('name')

    expect(mocks.where).toHaveBeenCalledWith('retired', '==', false)
    expect(mocks.orderBy).toHaveBeenCalledWith('name')
    expect(mocks.query).toHaveBeenCalledWith(
      expect.objectContaining({ path: 'testentity' }),
      expect.objectContaining({ field: 'retired', operator: '==', value: false }),
      expect.objectContaining({ field: 'name', type: 'orderBy' }),
    )
    expect(active).toMatchObject({
      base: expect.objectContaining({ path: 'testentity' }),
    })
  })

  it('loads single documents and skips missing document references', async () => {
    const entity = { id: 'alpha', name: 'Alpha', path: 'testentity/alpha' }
    mocks.getDoc.mockResolvedValue(snapshot(entity, entity.path))

    await expect(dao.getDataById('alpha')).resolves.toBe(entity)
    await expect(dao.getData(undefined)).resolves.toBeUndefined()

    expect(mocks.getDoc).toHaveBeenCalledTimes(1)
    expect(mocks.getDoc).toHaveBeenCalledWith(expect.objectContaining({ path: entity.path }))
  })

  it('loads lists, entity references and collection document references', async () => {
    const first = { id: 'first', name: 'First', path: 'testentity/first' }
    const second = { id: 'second', name: 'Second', path: 'testentity/second' }
    mocks.getDocs.mockResolvedValueOnce({
      docs: [snapshot(first, first.path), snapshot(second, second.path)],
    })

    await expect(dao.list()).resolves.toEqual([first, second])

    mocks.getDoc
      .mockResolvedValueOnce(snapshot(first, first.path))
      .mockResolvedValueOnce(snapshot(undefined, 'testentity/missing'))
      .mockResolvedValueOnce(snapshot(second, second.path))

    await expect(
      dao.entityList(['testentity/first', 'testentity/missing', 'testentity/second']),
    ).resolves.toEqual([first, second])
    await expect(dao.entityList(undefined)).resolves.toBeUndefined()

    const firstRef = mocks.makeDocRef(first.path)
    const secondRef = mocks.makeDocRef(second.path)
    mocks.getDocs.mockResolvedValueOnce({
      docs: [{ ref: firstRef }, { ref: secondRef }],
    })

    await expect(dao.collectionToDocuments(dao.collection())).resolves.toEqual([
      firstRef,
      secondRef,
    ])
    await expect(dao.collectionToDocuments(undefined)).resolves.toBeUndefined()
  })

  it('writes, updates and removes documents by entity path', async () => {
    const entity = { id: 'alpha', name: 'Alpha', path: 'testentity/alpha' }

    await dao.save(entity)
    await dao.update(entity.path, { name: 'Updated' })
    await dao.remove(entity.path)

    expect(mocks.setDoc).toHaveBeenCalledWith(
      expect.objectContaining({ path: entity.path }),
      entity,
    )
    expect(mocks.updateDoc).toHaveBeenCalledWith(expect.objectContaining({ path: entity.path }), {
      name: 'Updated',
    })
    expect(mocks.deleteDoc).toHaveBeenCalledWith(expect.objectContaining({ path: entity.path }))
  })
})

describe('GenericConverter', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('removes local-only key and path fields before writing', () => {
    const converter = new GenericConverter<TestEntity>()

    expect(
      converter.toFirestore({
        id: 'alpha',
        key: 'legacy-key',
        name: 'Alpha',
        path: 'testentity/alpha',
      } as TestEntity & { key: string }),
    ).toEqual({
      id: 'alpha',
      name: 'Alpha',
    })
  })

  it('writes entity references as Firestore document references', () => {
    const converter = new GenericConverter<TestEntity>()
    const venueRef = mocks.makeDocRef('venue/town-hall')

    const converted = converter.toFirestore({
      id: 'alpha',
      name: 'Alpha',
      path: 'testentity/alpha',
      text: { id: 'team-alpha', path: 'text/team-alpha' },
      venue: venueRef,
      users: [
        { id: 'alice', path: 'user/alice' },
        { type: 'document', path: 'user/bob' },
        legacyRef('user', 'carol'),
      ],
      nested: {
        secretary: { id: 'secretary', path: 'user/secretary' },
      },
    } as TestEntity & {
      text: { id: string; path: string }
      venue: ReturnType<typeof mocks.makeDocRef>
      users: unknown[]
      nested: { secretary: { id: string; path: string } }
    }) as Record<string, unknown>

    expect(converted.text).toMatchObject({ type: 'document', path: 'text/team-alpha' })
    expect(converted.venue).toBe(venueRef)
    expect(converted.users).toMatchObject([
      { type: 'document', path: 'user/alice' },
      { type: 'document', path: 'user/bob' },
      { type: 'document', path: 'user/carol' },
    ])
    expect(converted.nested).toMatchObject({
      secretary: { type: 'document', path: 'user/secretary' },
    })
  })

  it('hydrates ids, paths, legacy competition wrappers and nested legacy references', () => {
    const converter = new GenericConverter<{
      id: string
      _name: string
      path: string
      teams: Array<{ captain: { path: string } }>
      text: { path: string }
    }>()

    const converted = converter.fromFirestore(
      snapshot(
        {
          CupCompetition: {
            id: 'ignored-id',
            text: legacyRef('text', 'cup-copy', 'season/2025/competition/cup'),
            teams: [{ captain: legacyRef('team', 'alpha') }],
          },
        },
        'season/2025/competition/cup',
      ) as never,
    )

    expect(converted).toMatchObject({
      id: 'cup',
      _name: 'cup',
      path: 'season/2025/competition/cup',
      text: expect.objectContaining({ path: 'season/2025/competition/cup/text/cup-copy' }),
      teams: [{ captain: expect.objectContaining({ path: 'team/alpha' }) }],
    })
  })

  it('preserves Firestore document references when hydrating saved documents', () => {
    const converter = new GenericConverter<{
      id: string
      path: string
      text: { path: string }
      users: Array<{ path: string }>
    }>()
    const textRef = mocks.makeDocRef('text/team-alpha')
    const userRef = mocks.makeDocRef('user/alice')

    const converted = converter.fromFirestore(
      snapshot(
        {
          id: 'alpha',
          text: textRef,
          users: [userRef],
        },
        'team/alpha',
      ) as never,
    )

    expect(converted.text).toBe(textRef)
    expect(converted.users[0]).toBe(userRef)
  })

  it('hydrates saved path/id reference maps as Firestore document references', () => {
    const converter = new GenericConverter<{
      id: string
      path: string
      text: { path: string }
      users: Array<{ path: string }>
    }>()

    const converted = converter.fromFirestore(
      snapshot(
        {
          id: 'alpha',
          text: { id: 'team-alpha', path: 'text/team-alpha' },
          users: [{ id: 'alice', path: 'user/alice' }],
        },
        'team/alpha',
      ) as never,
    )

    expect(converted.text).toMatchObject({ path: 'text/team-alpha' })
    expect(converted.users[0]).toMatchObject({ path: 'user/alice' })
  })

  it('normalizes legacy reference paths without a leading slash', () => {
    expect(toPath(legacyRef('text', 'front-page'))).toBe('text/front-page')
    expect(toPath(legacyRef('competition', 'league', 'season/2025'))).toBe(
      'season/2025/competition/league',
    )
  })
})

describe('specific DAO helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getDoc.mockReset()
    mocks.getDocs.mockReset()
    mocks.uuid.mockReturnValue('generated-user-id')
  })

  it('targets the singleton application context document', async () => {
    const appContext = { id: SINGLETON_ID, leagueName: 'Quiz League' }
    mocks.getDoc.mockResolvedValue(snapshot(appContext, `applicationcontext/${SINGLETON_ID}`))

    expect(ApplicationContextDAO.get()).toMatchObject({
      path: `applicationcontext/${SINGLETON_ID}`,
    })
    await expect(ApplicationContextDAO.getAppContext()).resolves.toBe(appContext)
  })

  it('returns the first site user matching a Firebase uid', async () => {
    const first = { id: 'site-user-1', path: 'siteuser/site-user-1', uid: 'uid-1' }
    const second = { id: 'site-user-2', path: 'siteuser/site-user-2', uid: 'uid-1' }
    mocks.getDocs.mockResolvedValue({
      docs: [snapshot(first, first.path), snapshot(second, second.path)],
    })

    await expect(SiteUserDAO.siteUserForUid('uid-1')).resolves.toBe(first)

    expect(mocks.where).toHaveBeenCalledWith('uid', '==', 'uid-1')
    expect(mocks.query).toHaveBeenCalledWith(
      expect.objectContaining({ path: 'siteuser' }),
      expect.objectContaining({ field: 'uid', operator: '==', value: 'uid-1' }),
    )
  })

  it('returns undefined when no site user matches a Firebase uid', async () => {
    mocks.getDocs.mockResolvedValue({ docs: [] })

    await expect(SiteUserDAO.siteUserForUid('missing-uid')).resolves.toBeUndefined()
  })

  it('creates statistics queries scoped by team and season', () => {
    const seasonStats = StatisticsDAO.teamStats('team-1', 'season-1')
    const allTeamStats = StatisticsDAO.allTeamStats('team-1')

    expect(seasonStats).toMatchObject({
      base: expect.objectContaining({ path: 'statistics' }),
      constraints: [
        expect.objectContaining({ field: 'team.id', value: 'team-1' }),
        expect.objectContaining({ field: 'season.id', value: 'season-1' }),
      ],
    })
    expect(allTeamStats).toMatchObject({
      base: expect.objectContaining({ path: 'statistics' }),
      constraints: [expect.objectContaining({ field: 'team.id', value: 'team-1' })],
    })
  })

  it('creates a new user entity with a generated id and path', () => {
    mocks.uuid.mockReturnValue('user-1')

    expect(UserDAO.newInstance()).toMatchObject({
      id: 'user-1',
      name: '',
      email: '',
      path: 'user/user-1',
      retired: false,
    })
  })
})

describe('fixture DAO converters', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('hydrates fixture groups with nested fixture collection proxies', () => {
    const fixturesPath = 'season/2025/competition/league/fixtures/week-1'

    const fixtures = FixturesDAO.converter.fromFirestore(
      snapshot(
        {
          id: 'week-1',
          description: 'Week 1',
          date: '2026-01-01',
          start: '19:30',
          questionsUrl: 'https://example.com/questions',
        },
        fixturesPath,
      ) as never,
    )

    expect(fixtures).toMatchObject({
      id: 'week-1',
      description: 'Week 1',
      path: fixturesPath,
      questionsUrl: 'https://example.com/questions',
    })
    expect(fixtures.fixture.get()).toMatchObject({ path: `${fixturesPath}/fixture` })
  })

  it('hydrates fixtures with team, venue, result submitter and report references', () => {
    const fixturePath = 'season/2025/competition/league/fixtures/week-1/fixture/fixture-1'

    const fixture = fixtureDAO.converter.fromFirestore(
      snapshot(
        {
          id: 'fixture-1',
          home: legacyRef('team', 'alpha'),
          away: legacyRef('team', 'bravo'),
          venue: legacyRef('venue', 'club-house'),
          result: {
            homeScore: 42,
            awayScore: 40,
            submitter: legacyRef('user', 'scorer'),
            note: 'Checked',
          },
        },
        fixturePath,
      ) as never,
    )

    expect(fixture).toMatchObject({
      id: 'fixture-1',
      path: fixturePath,
      home: expect.objectContaining({ path: 'team/alpha' }),
      away: expect.objectContaining({ path: 'team/bravo' }),
      venue: expect.objectContaining({ path: 'venue/club-house' }),
      result: expect.objectContaining({
        homeScore: 42,
        awayScore: 40,
        submitter: expect.objectContaining({ path: 'user/scorer' }),
        note: 'Checked',
      }),
    })
    expect(fixture.result?.report?.get()).toMatchObject({ path: `${fixturePath}/report` })
  })

  it('rejects fixtures without required team references', () => {
    expect(() =>
      fixtureDAO.converter.fromFirestore(
        snapshot(
          {
            id: 'fixture-1',
            away: legacyRef('team', 'bravo'),
          },
          'fixture/fixture-1',
        ) as never,
      ),
    ).toThrow('Fixture fixture-1 is missing required home or away team reference')
  })

  it('hydrates reports and rejects reports without required references', () => {
    const reportPath = 'fixture/fixture-1/report/report-1'

    const report = reportDAO.converter.fromFirestore(
      snapshot(
        {
          id: 'report-1',
          team: legacyRef('team', 'alpha'),
          text: legacyRef('text', 'match-report'),
        },
        reportPath,
      ) as never,
    )

    expect(report).toMatchObject({
      id: 'report-1',
      path: reportPath,
      team: expect.objectContaining({ path: 'team/alpha' }),
      text: expect.objectContaining({ path: 'text/match-report' }),
    })
    expect(() =>
      reportDAO.converter.fromFirestore(
        snapshot(
          {
            id: 'report-2',
            team: legacyRef('team', 'alpha'),
          },
          'fixture/fixture-1/report/report-2',
        ) as never,
      ),
    ).toThrow('Report report-2 is missing required team or text reference')
  })
})
