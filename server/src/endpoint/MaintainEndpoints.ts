import { Season } from '@quizleague/shared'
import { Application, Request, Response } from 'express'
import { entityPath, load } from '../storage/Storage'
import { calculateStats } from './StatisticsUtils'
import { param, send } from './util'

const root = '/rest/maintain'

export default function configureMaintain(app: Application) {
  app.post(`${root}/season/:seasonId/statistics/recalculate`, recalculateSeasonStatistics)
}

function recalculateSeasonStatistics(req: Request, res: Response) {
  return send(recalculateStatistics(param('seasonId', req)), res)
}

async function recalculateStatistics(seasonId: string) {
  const season = await load<Season>(entityPath('season', seasonId))

  await calculateStats(season)

  return { seasonId }
}
