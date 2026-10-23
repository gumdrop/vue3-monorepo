export interface QuizQuestion {
  number: string
  question: string
  answer: string
}

export interface QuizRound {
  round: string
  subjects?: string[]
  questions: QuizQuestion[]
}

export interface QuizPaper {
  rounds: QuizRound[]
}
