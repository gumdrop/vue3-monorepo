import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => {
  const docRef = { path: 'quizmaster-sessions/doc' }
  return {
    docRef,
    doc: vi.fn(() => docRef),
    setDoc: vi.fn(),
    getDoc: vi.fn(),
    deleteDoc: vi.fn(),
    useFirestore: vi.fn(() => ({ projectId: 'test' })),
  }
})

vi.mock('firebase/firestore', () => ({
  doc: mocks.doc,
  setDoc: mocks.setDoc,
  getDoc: mocks.getDoc,
  deleteDoc: mocks.deleteDoc,
}))

vi.mock('vuefire', () => ({
  useFirestore: mocks.useFirestore,
}))

import type { QuizSession } from '../QuizMasterSession'
import {
  clearQuizSession,
  loadQuizSession,
  quizSessionDocId,
  saveQuizSession,
} from '../QuizMasterSession'

const payload = (): Omit<QuizSession, 'fixturePath' | 'updatedAt'> => ({
  homeIsAFirstHalf: true,
  homePlayers: ['Alice', 'Bob', 'Carol'],
  awayPlayers: [],
  outcomes: {},
  spares: {},
  spareCursor: 0,
  jokers: {},
  categoryAssignments: {},
  beerRoundScore: { home: 0, away: 0 },
  score: { home: 0, away: 0 },
  history: [],
  step: 3,
  matchPosition: { roundIndex: 0, questionIndex: 1, phase: 'rounds' },
})

describe('quizSessionDocId', () => {
  it('produces a deterministic, slash-free id', () => {
    const path = 'season/1/competition/cup/fixtures/s1/fixture/f-1'
    const id = quizSessionDocId(path)

    expect(id).toBe(quizSessionDocId(path))
    expect(id).toBe('season~1~competition~cup~fixtures~s1~fixture~f-1')
    expect(id).not.toContain('/')
    expect(id).not.toContain('%')
  })
})

describe('QuizMasterSession persistence', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.setDoc.mockResolvedValue(undefined)
    mocks.deleteDoc.mockResolvedValue(undefined)
  })

  it('saves a session with fixturePath and a timestamp', async () => {
    await saveQuizSession('fixture/path', payload())

    expect(mocks.doc).toHaveBeenCalledWith(
      mocks.useFirestore(),
      `quizmaster-sessions/${quizSessionDocId('fixture/path')}`,
    )
    expect(mocks.setDoc).toHaveBeenCalledWith(mocks.docRef, {
      ...payload(),
      fixturePath: 'fixture/path',
      updatedAt: expect.any(String),
    })
  })

  it('loads an existing session', async () => {
    mocks.getDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({ fixturePath: 'fixture/path' }),
    })

    await expect(loadQuizSession('fixture/path')).resolves.toEqual({
      fixturePath: 'fixture/path',
    })
  })

  it('returns undefined when no session exists', async () => {
    mocks.getDoc.mockResolvedValue({ exists: () => false, data: () => undefined })

    await expect(loadQuizSession('fixture/path')).resolves.toBeUndefined()
  })

  it('clears a session', async () => {
    await clearQuizSession('fixture/path')

    expect(mocks.deleteDoc).toHaveBeenCalledWith(mocks.docRef)
  })
})
