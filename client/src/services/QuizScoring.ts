export type TeamSide = 'home' | 'away'
export type QuestionOutcome = 'correct' | 'bonus' | 'unanswered'
export type QuestionSuffix = 'A' | 'B'

export interface Score {
  home: number
  away: number
}

export interface Jokers {
  home?: string
  away?: string
}

export const initialScore: Score = { home: 0, away: 0 }

// Rounds 6-10 are the second half; A/B ownership swaps there.
export const isSecondHalf = (roundNumber: number): boolean => roundNumber >= 6

// Which side is the "A" team for a given round. By default home is A in half 1.
export const aSideForRound = (roundNumber: number, homeIsAFirstHalf = true): TeamSide => {
  const homeIsA = isSecondHalf(roundNumber) ? !homeIsAFirstHalf : homeIsAFirstHalf
  return homeIsA ? 'home' : 'away'
}

// Which side owns a question with the given A/B suffix in a given round.
export const owningSide = (
  roundNumber: number,
  suffix: QuestionSuffix,
  homeIsAFirstHalf = true,
): TeamSide => {
  const aSide = aSideForRound(roundNumber, homeIsAFirstHalf)
  return suffix === 'A' ? aSide : aSide === 'home' ? 'away' : 'home'
}

// Points for a recorded outcome, with optional joker doubling.
export const outcomePoints = (outcome: QuestionOutcome, joker = false): number => {
  const base = outcome === 'correct' ? 2 : outcome === 'bonus' ? 1 : 0
  return joker ? base * 2 : base
}

// Apply a recorded outcome. A "bonus" scores for the non-owning team.
export const applyOutcome = (
  score: Score,
  owner: TeamSide,
  outcome: QuestionOutcome,
  joker = false,
): Score => {
  const points = outcomePoints(outcome, joker)
  const scoringSide = outcome === 'bonus' ? (owner === 'home' ? 'away' : 'home') : owner
  return scoringSide === 'home'
    ? { home: score.home + points, away: score.away }
    : { home: score.home, away: score.away + points }
}

// Whether a team's joker doubles a given category.
export const jokerApplies = (
  scoringSide: TeamSide,
  category: string | undefined,
  jokers: Jokers,
): boolean => category !== undefined && jokers[scoringSide] === category

// Numeric prefix of a question number (e.g. "2A" -> 2, "1" -> 1; "" -> 0).
export const questionNumberPrefix = (number: string): number => {
  const match = number.match(/^\d+/)
  return match ? Number(match[0]) : 0
}

// Subject for an individual-round question, mapped from its numeric prefix.
export const subjectForQuestion = (number: string, subjects: string[]): string | undefined => {
  const prefix = questionNumberPrefix(number)
  return prefix >= 1 && prefix <= subjects.length ? subjects[prefix - 1] : undefined
}

// A round is individual when it has subjects (only Individual rounds do).
export const isIndividualRound = (round: { subjects?: string[] }): boolean =>
  Boolean(round.subjects && round.subjects.length > 0)
