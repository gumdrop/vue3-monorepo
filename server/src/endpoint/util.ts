import { Request, Response } from 'express'
import { entityPath, load } from '../storage/Storage'
import { ApplicationContext, Season, SINGLETON_ID } from '@quizleague/shared'

export function send<T>(result: Promise<T> | T, res: Response) {
  Promise.resolve(result)
    .then((r) => {
      res.json(r)
    })
    .catch((e: Error) => {
      res.status(500)
      res.statusMessage = 'Internal server error'
      res.send(e.message)
    })
}

export function sendText(result: Promise<string> | string, res: Response) {
  Promise.resolve(result)
    .then((r) => {
      res.send(r)
    })
    .catch((e: Error) => {
      res.status(500)
      res.statusMessage = 'Internal server error'
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
