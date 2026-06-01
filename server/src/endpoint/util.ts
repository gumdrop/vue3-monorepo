import { Request, Response } from 'express'
import { entityPath, load } from '../storage/Storage'
import { ApplicationContext, Season, SINGLETON_ID } from '@quizleague/shared'

export class HttpError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly statusMessage = message,
  ) {
    super(message)
  }
}

const statusForError = (error: Error) =>
  error instanceof HttpError
    ? { code: error.statusCode, message: error.statusMessage }
    : { code: 500, message: 'Internal server error' }

export function send<T>(result: Promise<T> | T, res: Response) {
  Promise.resolve(result)
    .then((r) => {
      res.json(r)
    })
    .catch((e: Error) => {
      const status = statusForError(e)
      res.status(status.code)
      res.statusMessage = status.message
      res.send(e.message)
    })
}

export function sendText(result: Promise<string> | string, res: Response) {
  Promise.resolve(result)
    .then((r) => {
      res.send(r)
    })
    .catch((e: Error) => {
      const status = statusForError(e)
      res.status(status.code)
      res.statusMessage = status.message
      res.send(e.message)
    })
}

export function param(name: string, req: Request) {
  console.log(`params : ${JSON.stringify(req.params)}`)
  return req.params[name]
}

export const applicationContext = async () =>
  load<ApplicationContext>(entityPath('applicationcontext', SINGLETON_ID))

export const currentSeason = async () => load<Season>((await applicationContext()).currentSeason)
