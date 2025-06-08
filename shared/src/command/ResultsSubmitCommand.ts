export interface ResultsSubmitCommand {
  fixtures: ResultValues[]
  reportText: string | undefined
  userID: string
}

export interface ResultValues {
  fixturePath: string
  homeScore: number
  awayScore: number
}
