export type QuizQuestionOutcome = 'correct' | 'bonus' | 'unanswered'

export interface QuizReportQuestion {
  number: string
  question: string
  answer: string
  outcome: QuizQuestionOutcome
  category?: string
  contestant?: string
  joker?: 'home' | 'away' | 'both'
}

export interface QuizReportRound {
  name: string
  questions: QuizReportQuestion[]
}

export interface QuizReportTieBreak {
  winner: 'home' | 'away'
  method: string
  sections?: { name: string; homeCorrect: number; awayCorrect: number }[]
}

export interface QuizReportCommand {
  homeTeam: string
  awayTeam: string
  homeScore: number
  awayScore: number
  beerRoundHomeScore: number
  beerRoundAwayScore: number
  rounds: QuizReportRound[]
  tieBreak?: QuizReportTieBreak
}
