import { Application, Request, Response } from 'express'
import { param, send } from './util'
import { recalculateTable, regenerateStats } from './EntityFunctions'

const root = '/rest/entity'

export default function configure(app: Application) {
  app
    .post(`${root}/regenerate-stats/:seasonId`, regenStats)
    .post(`${root}/recalculate-table`, recalcTable)
}

function regenStats(req: Request, res: Response) {
  return send(regenerateStats(param('seasonId', req)), res)
}

function recalcTable(req: Request, res: Response) {
  return send(recalculateTable(req.body.toString()), res)
}
