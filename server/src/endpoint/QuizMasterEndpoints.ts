import { Application, Request, Response } from 'express'
import type { QuizAcquireCommand, QuizReportCommand } from '@quizleague/shared'
import { generateMatchReport } from './DeepSeekResultsSummary'
import { acquireQuiz } from './QuizMasterFunctions'
import { send } from './util'

const root = '/rest/site'

export default function configure(app: Application) {
  app.post(`${root}/quiz/acquire`, postQuizAcquire).post(`${root}/quiz/report`, postQuizReport)
}

function postQuizAcquire(req: Request, res: Response) {
  send(acquireQuiz(parseBody<QuizAcquireCommand>(req)), res)
}

function postQuizReport(req: Request, res: Response) {
  send(
    Promise.resolve().then(async () => {
      const report = await generateMatchReport(parseBody<QuizReportCommand>(req))
      if (!report) {
        throw new Error('Match report could not be generated')
      }
      return report
    }),
    res,
  )
}

function parseBody<T>(req: Request) {
  return (typeof req.body === 'string' ? JSON.parse(req.body) : req.body) as T
}
