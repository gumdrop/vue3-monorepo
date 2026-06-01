import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  collection,
  delete1,
  deleteAll,
  docRef,
  docRefById,
  entityPath,
  list,
  load,
  runQuery,
  save,
  saveAll,
} from '../Storage'

const mocks = vi.hoisted(() => ({
  batch: vi.fn(),
  batchCommit: vi.fn(),
  batchDelete: vi.fn(),
  batchSet: vi.fn(),
  collection: vi.fn(),
  doc: vi.fn(),
  emulatorAddr: vi.fn(() => '127.0.0.1:8080'),
  Firestore: vi.fn(),
  isLocal: vi.fn(() => false),
  settings: vi.fn(),
}))

vi.mock('@google-cloud/firestore', () => ({
  Firestore: mocks.Firestore,
}))

vi.mock('../..', () => ({
  emulatorAddr: mocks.emulatorAddr,
  isLocal: mocks.isLocal,
}))

const withConverter = vi.fn(function (this: unknown) {
  return this
})

const makeDoc = (path: string) => ({
  path,
  withConverter,
  set: vi.fn().mockResolvedValue(undefined),
  get: vi.fn().mockResolvedValue({
    data: () => ({ id: path.split('/').pop(), path, value: 'loaded' }),
  }),
})

const makeCollection = (path: string) => ({
  path,
  withConverter,
  get: vi.fn().mockResolvedValue({
    docs: [
      { data: () => ({ id: 'team-1' }) },
      { data: () => ({ id: 'team-2' }) },
    ],
  }),
})

describe('Storage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    withConverter.mockClear()
    mocks.batchCommit.mockResolvedValue(undefined)
    mocks.batch.mockImplementation(() => ({
      set: mocks.batchSet,
      delete: mocks.batchDelete,
      commit: mocks.batchCommit,
    }))
    mocks.doc.mockImplementation(makeDoc)
    mocks.collection.mockImplementation(makeCollection)
    mocks.Firestore.mockImplementation(() => ({
      batch: mocks.batch,
      collection: mocks.collection,
      doc: mocks.doc,
      settings: mocks.settings,
    }))
  })

  it('builds entity paths and document references by id', () => {
    expect(entityPath('team', 'team-1')).toBe('team/team-1')

    const ref = docRefById('team', 'team-1')

    expect(mocks.doc).toHaveBeenCalledWith('team/team-1')
    expect(ref).toEqual(expect.objectContaining({ path: 'team/team-1' }))
  })

  it('saves a single entity through a converted document reference', async () => {
    const entity = { id: 'team-1', path: 'team/team-1', name: 'Alpha' }

    const ref = await save(entity)

    expect(mocks.doc).toHaveBeenCalledWith('team/team-1')
    expect(ref.set).toHaveBeenCalledWith(entity)
    expect(ref).toEqual(expect.objectContaining({ path: 'team/team-1' }))
  })

  it('loads a single entity through a converted document reference', async () => {
    await expect(load('team/team-1')).resolves.toEqual({
      id: 'team-1',
      path: 'team/team-1',
      value: 'loaded',
    })
  })

  it('builds converted collections and maps query snapshots to data', async () => {
    const query = {
      get: vi.fn().mockResolvedValue({
        docs: [
          { data: () => ({ id: 'team-1' }) },
          { data: () => ({ id: 'team-2' }) },
        ],
      }),
    }

    const result = await runQuery(query as never)
    await expect(list('team')).resolves.toEqual(result)

    expect(result).toEqual([{ id: 'team-1' }, { id: 'team-2' }])
    expect(collection('fixture', 'season/season-1/competition/league/fixtures/week-1')).toEqual(
      expect.objectContaining({
        path: 'season/season-1/competition/league/fixtures/week-1/fixture',
      }),
    )
  })

  it('writes saves in batches of 400 entities', async () => {
    const entities = Array.from({ length: 401 }, (_, index) => ({
      id: `team-${index}`,
      path: `team/team-${index}`,
    }))

    await saveAll(entities)

    expect(mocks.batch).toHaveBeenCalledTimes(2)
    expect(mocks.batchSet).toHaveBeenCalledTimes(401)
    expect(mocks.batchCommit).toHaveBeenCalledTimes(2)
  })

  it('deletes entities in batches and supports the single-entity helper', async () => {
    const entities = Array.from({ length: 401 }, (_, index) => ({
      id: `team-${index}`,
      path: `team/team-${index}`,
    }))

    await deleteAll(entities)
    await delete1({ id: 'team-single', path: 'team/team-single' })

    expect(mocks.batch).toHaveBeenCalledTimes(3)
    expect(mocks.batchDelete).toHaveBeenCalledTimes(402)
    expect(mocks.batchCommit).toHaveBeenCalledTimes(3)
  })

  it('configures Firestore for the emulator when running locally', async () => {
    vi.resetModules()
    mocks.isLocal.mockReturnValue(true)

    const storage = await import('../Storage')
    storage.docRef('team/team-local')

    expect(mocks.Firestore).toHaveBeenCalledWith({ projectId: 'chiltern-ql-firestore' })
    expect(mocks.settings).toHaveBeenCalledWith({ host: '127.0.0.1:8080', ssl: false })
  })
})
