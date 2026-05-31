import { Season, Text } from '@quizleague/shared'
import { Application, Request, Response } from 'express'
import { entityPath, load } from '../storage/Storage'
import { regenerateFixtureSetResultsSummary } from './TaskFunctions'
import { calculateStats } from './StatisticsUtils'
import { param, send } from './util'

const root = '/rest/maintain'

export default function configureMaintain(app: Application) {
  app
    .post(`${root}/season/:seasonId/statistics/recalculate`, recalculateSeasonStatistics)
    .post(`${root}/fixtures/results-summary/regenerate`, regenerateResultsSummary)
}

function recalculateSeasonStatistics(req: Request, res: Response) {
  return send(recalculateStatistics(param('seasonId', req)), res)
}

async function recalculateStatistics(seasonId: string) {
  const season = await load<Season>(entityPath('season', seasonId))

  await calculateStats(season)

  return { seasonId }
}

function regenerateResultsSummary(req: Request, res: Response) {
  return send(regenerateSummary(parseBody<RegenerateSummaryCommand>(req)), res)
}

interface RegenerateSummaryCommand {
  fixtureSetPath: string
}

async function regenerateSummary(command: RegenerateSummaryCommand) {
  const fixtureSet = await regenerateFixtureSetResultsSummary(command.fixtureSetPath)
  const summaryText = fixtureSet.resultsSummary
    ? await load<Text>(fixtureSet.resultsSummary)
    : undefined

  if (!summaryText?.text?.trim()) {
    throw new Error('Gemini did not return a fixture set results summary')
  }

  return {
    fixtureSetPath: fixtureSet.path,
    resultsSummary: { id: summaryText.id, path: summaryText.path },
    resultsSummaryText: summaryText.text,
    resultsSummaryGeneratedAt: fixtureSet.resultsSummaryGeneratedAt,
    resultsSummaryModel: fixtureSet.resultsSummaryModel,
  }
}

function parseBody<T>(req: Request) {
  return (typeof req.body === 'string' ? JSON.parse(req.body) : req.body) as T
}
