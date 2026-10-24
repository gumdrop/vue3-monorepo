import { deleteDoc, doc, getDoc, setDoc } from 'firebase/firestore'
import { useFirestore } from 'vuefire'
import type { QuizQuestionOutcome } from '@quizleague/shared'

const COLLECTION = 'quizmaster-sessions'

// A resumable quiz-master session. The parsed quiz paper is intentionally NOT
// persisted: on resume the question master re-enters the password and the quiz
// is re-parsed from scratch (FR-1.2 keeps the password out of any store).
export interface QuizSession {
  fixturePath: string
  homeIsAFirstHalf: boolean
  homePlayers: string[]
  awayPlayers: string[]
  outcomes: Record<string, QuizQuestionOutcome>
  spares: Record<string, { number: string; question: string; answer: string }>
  spareCursor: { A: number; B: number }
  jokers: Record<string, { home?: string; away?: string }>
  categoryAssignments: Record<string, { home: Record<string, string>; away: Record<string, string> }>
  beerRoundScore: { home: number; away: number }
  score: { home: number; away: number }
  history: { score: { home: number; away: number }; key: string }[]
  step: 2 | 3 | 4
  matchPosition: { roundIndex: number; questionIndex: number; phase: 'rounds' | 'beer' }
  report?: { text: string; model: string }
  updatedAt: string
}

export const quizSessionDocId = (fixturePath: string) => encodeURIComponent(fixturePath)

export const quizSessionDocRef = (fixturePath: string) =>
  doc(useFirestore(), `${COLLECTION}/${quizSessionDocId(fixturePath)}`)

export async function saveQuizSession(
  fixturePath: string,
  session: Omit<QuizSession, 'fixturePath' | 'updatedAt'>,
): Promise<void> {
  await setDoc(quizSessionDocRef(fixturePath), {
    ...session,
    fixturePath,
    updatedAt: new Date().toISOString(),
  })
}

export async function loadQuizSession(
  fixturePath: string,
): Promise<QuizSession | undefined> {
  const snapshot = await getDoc(quizSessionDocRef(fixturePath))
  return snapshot.exists() ? (snapshot.data() as QuizSession) : undefined
}

export async function clearQuizSession(fixturePath: string): Promise<void> {
  await deleteDoc(quizSessionDocRef(fixturePath))
}
