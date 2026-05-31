import { flushPromises } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'

import type Entity from '@/entity/Entity'
import { getDoc } from 'firebase/firestore'
import { useDocumentListRef } from '../Documents'

vi.mock('firebase/firestore', () => ({
  getDoc: vi.fn(),
}))

interface TestEntity extends Entity {
  name: string
}

const documentRef = (path: string) => ({
  id: path.split('/').pop(),
  path,
})

const snapshot = <T>(data: T | undefined) => ({
  data: () => data,
})

describe('useDocumentListRef', () => {
  it('maps document references to entity data and skips missing documents', async () => {
    const alpha = { id: 'alpha', path: 'team/alpha', name: 'Alpha' }
    vi.mocked(getDoc)
      .mockResolvedValueOnce(snapshot(alpha) as never)
      .mockResolvedValueOnce(snapshot(undefined) as never)

    const teams = useDocumentListRef<TestEntity>(
      Promise.resolve([documentRef('team/alpha'), documentRef('team/missing')] as never),
    )

    expect(teams.value).toEqual([])
    await flushPromises()

    expect(teams.value).toEqual([alpha])
  })

  it('allows callers to replace the local ref value', async () => {
    const teams = useDocumentListRef<TestEntity>(Promise.resolve([]))
    const bravo = { id: 'bravo', path: 'team/bravo', name: 'Bravo' }

    teams.value = [bravo]

    expect(teams.value).toEqual([bravo])
  })
})
