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
// Whether a team's joker doubles a given category. The caller passes the
// PRIMARY (owner) side for the question — the joker doubles the whole question
// on that side's nominated category (correct 2->4, bonus 1->2).
export const jokerApplies = (
  side: TeamSide,
  category: string | undefined,
  jokers: Jokers,
): boolean => category !== undefined && jokers[side] === category

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

// Cup tie-break rules: played after a cup match finishes level after 10 rounds.
// Each section is answered by both teams simultaneously and marked per team.

export interface TieBreakQuestion {
  number: string
  question: string
  answer: string
}

export interface TieBreakSection {
  name: string
  kind: 'spares' | 'beer'
  questions: TieBreakQuestion[]
}

export interface TieBreakMarks {
  home?: boolean
  away?: boolean
}

export interface TieBreakOutcomeEntry {
  outcome: QuestionOutcome
  owner: TeamSide
}

export const BEER_LEG_SECTION_SIZE = 4

export const buildTieBreakSections = (
  spares: TieBreakQuestion[],
  beerLeg: TieBreakQuestion[],
): TieBreakSection[] => {
  const sections: TieBreakSection[] = []

  if (spares.length > 0) {
    sections.push({ name: 'Spare questions', kind: 'spares', questions: [...spares] })
  }

  for (let index = 0; index < beerLeg.length; index += BEER_LEG_SECTION_SIZE) {
    const chunk = beerLeg.slice(index, index + BEER_LEG_SECTION_SIZE)
    sections.push({
      name: `Beer leg ${index / BEER_LEG_SECTION_SIZE + 1} (questions ${index + 1}–${index + chunk.length})`,
      kind: 'beer',
      questions: chunk,
    })
  }

  return sections
}

export const tieBreakSectionWinner = (marks: TieBreakMarks[]): TeamSide | undefined => {
  const home = marks.filter((mark) => mark.home === true).length
  const away = marks.filter((mark) => mark.away === true).length
  if (home === away) return undefined
  return home > away ? 'home' : 'away'
}

export const ownCorrectCounts = (entries: TieBreakOutcomeEntry[]) => ({
  home: entries.filter((entry) => entry.outcome === 'correct' && entry.owner === 'home').length,
  away: entries.filter((entry) => entry.outcome === 'correct' && entry.owner === 'away').length,
})

export const bonusCorrectCounts = (entries: TieBreakOutcomeEntry[]) => ({
  home: entries.filter((entry) => entry.outcome === 'bonus' && entry.owner === 'away').length,
  away: entries.filter((entry) => entry.outcome === 'bonus' && entry.owner === 'home').length,
})

export const coinTossWinner = (
  awayCall: 'heads' | 'tails' | undefined,
  toss: 'heads' | 'tails' | undefined,
): TeamSide | undefined => {
  if (!awayCall || !toss) return undefined
  return awayCall === toss ? 'away' : 'home'
}
