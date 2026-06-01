import { beforeEach, describe, expect, it, vi } from 'vitest'

import { docData } from '../FirebaseService'

const mocks = vi.hoisted(() => ({
  getDoc: vi.fn(),
}))

vi.mock('firebase/firestore', () => ({
  getDoc: mocks.getDoc,
}))

describe('FirebaseService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns undefined when no document reference is provided', async () => {
    await expect(docData(undefined)).resolves.toBeUndefined()

    expect(mocks.getDoc).not.toHaveBeenCalled()
  })

  it('loads data for a document reference', async () => {
    const data = { id: 'entity-1' }
    const docRef = { path: 'entity/entity-1' }
    mocks.getDoc.mockResolvedValue({
      data: () => data,
    })

    await expect(docData(docRef as never)).resolves.toBe(data)
    expect(mocks.getDoc).toHaveBeenCalledWith(docRef)
  })
})
