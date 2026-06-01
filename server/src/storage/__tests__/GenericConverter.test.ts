import { beforeEach, describe, expect, it, vi } from 'vitest'
import { GenericConverter } from '../GenericConverter'

const mocks = vi.hoisted(() => ({
  db: vi.fn(),
  doc: vi.fn(),
}))

vi.mock('../Storage', () => ({
  db: mocks.db,
}))

const firestoreRef = (path: string) => {
  const ref = {
    path,
    withConverter: vi.fn(),
  }
  ref.withConverter.mockReturnValue(ref)
  return ref
}

describe('GenericConverter', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.doc.mockImplementation((path: string) => firestoreRef(path))
    mocks.db.mockReturnValue({ doc: mocks.doc })
  })

  it('converts entity references to Firestore document references and strips local fields', () => {
    const converter = new GenericConverter<any>()
    const created = new Date('2026-05-31T10:00:00.000Z')
    const existingRef = firestoreRef('team/existing')

    const result = converter.toFirestore({
      id: 'fixture-1',
      path: 'fixture/fixture-1',
      key: 'local-key',
      home: { id: 'team-1', path: 'team/team-1' },
      away: { type: 'document', path: '/team/team-2/' },
      legacyVenue: {
        id: 'venue-1',
        typeName: 'venue',
        key: { parentKey: 'season/season-1' },
      },
      existingRef,
      invalidReference: { id: 'bad', path: 'team' },
      nested: {
        ref: { id: 'team-3', path: 'team/team-3' },
        emptyMethods: { toString() {} },
      },
      refs: [
        { id: 'team-4', path: 'team/team-4' },
        { id: 'bad-list-ref', path: 'team' },
        undefined,
      ],
      created,
      ignoredFunction: () => undefined,
    })

    expect(result).toEqual({
      id: 'fixture-1',
      home: expect.objectContaining({ path: 'team/team-1' }),
      away: expect.objectContaining({ path: 'team/team-2' }),
      legacyVenue: expect.objectContaining({ path: 'season/season-1/venue/venue-1' }),
      existingRef,
      invalidReference: expect.objectContaining({ path: 'team/bad' }),
      nested: { ref: expect.objectContaining({ path: 'team/team-3' }) },
      refs: [
        expect.objectContaining({ path: 'team/team-4' }),
        expect.objectContaining({ path: 'team/bad-list-ref' }),
      ],
      created,
    })
    expect(result).not.toHaveProperty('path')
    expect(result).not.toHaveProperty('key')
    expect(result).not.toHaveProperty('ignoredFunction')
  })

  it('converts Firestore snapshots back to entities with normalized document references', () => {
    const converter = new GenericConverter<any>()
    const existingRef = firestoreRef('team/existing')
    const snapshot = {
      ref: { path: 'statistics/stat-1' },
      data: () => ({
        team: { id: 'team-1', path: 'team/team-1' },
        nested: {
          venue: { type: 'document', path: '/venue/venue-1/' },
        },
        refs: [{ id: 'team-2', path: 'team/team-2' }],
        existingRef,
      }),
    }

    const result = converter.fromFirestore(snapshot as never)

    expect(result).toEqual({
      id: 'stat-1',
      path: 'statistics/stat-1',
      team: expect.objectContaining({ path: 'team/team-1' }),
      nested: {
        venue: expect.objectContaining({ path: 'venue/venue-1' }),
      },
      refs: [expect.objectContaining({ path: 'team/team-2' })],
      existingRef,
    })
    expect(existingRef.withConverter).not.toHaveBeenCalled()
  })
})
