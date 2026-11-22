import { Fixture, Fixtures, Season, Text } from '@quizleague/shared'
import { Application, Request, Response } from 'express'
import { entityPath, list, load } from '../storage/Storage'
import { regenerateCompetitionRoundup, regenerateFixtureSetResultsSummary } from './TaskFunctions'
import { calculateStats } from './StatisticsUtils'
import { recalculateSeasonStatisticsAggregation } from './SeasonStatisticsAggregationUtils'
import { rebuildSeasonFixtureIndex, upsertFixtureIndexForFixtureSet } from './FixtureIndexUtils'
import { param, send } from './util'

const root = '/rest/maintain'

export default function configureMaintain(app: Application) {
  app
    .post(`${root}/season/:seasonId/statistics/recalculate`, recalculateSeasonStatistics)
    .post(
      `${root}/season/:seasonId/statistics/aggregation/recalculate`,
      recalculateSeasonStatisticsAggregationEndpoint,
    )
    .post(`${root}/season/:seasonId/fixture-index/rebuild`, rebuildFixtureIndex)
    .post(`${root}/fixture-set/fixture-index/upsert`, upsertFixtureSetIndex)
    .post(`${root}/fixtures/results-summary/regenerate`, regenerateResultsSummary)
    .post(`${root}/competition/roundup/regenerate`, regenerateRoundup)
}

function recalculateSeasonStatistics(req: Request, res: Response) {
  return send(recalculateStatistics(param('seasonId', req)), res)
}

async function recalculateStatistics(seasonId: string) {
  const season = await load<Season>(entityPath('season', seasonId))

  await calculateStats(season)

  return { seasonId }
}

function recalculateSeasonStatisticsAggregationEndpoint(req: Request, res: Response) {
  return send(recalculateStatisticsAggregation(param('seasonId', req)), res)
}

async function recalculateStatisticsAggregation(seasonId: string) {
  const season = await load<Season>(entityPath('season', seasonId))
  const aggregation = await recalculateSeasonStatisticsAggregation(season)

  return {
    seasonId,
    competitions: aggregation.competitions.length,
  }
}

function rebuildFixtureIndex(req: Request, res: Response) {
  return send(rebuildSeasonFixtureIndexEndpoint(param('seasonId', req)), res)
}

function upsertFixtureSetIndex(req: Request, res: Response) {
  return send(upsertFixtureSetIndexCommand(parseBody<UpsertFixtureSetIndexCommand>(req)), res)
}

interface UpsertFixtureSetIndexCommand {
  fixtureSetPath: string
}

async function upsertFixtureSetIndexCommand(command: UpsertFixtureSetIndexCommand) {
  const fixtureSet = await load<Fixtures>(command.fixtureSetPath)
  if (!fixtureSet) {
    throw new Error(`Fixture set not found: ${command.fixtureSetPath}`)
  }

  const fixtures = await list<Fixture>('fixture', fixtureSet.path)
  await upsertFixtureIndexForFixtureSet(fixtureSet, fixtures)

  return { fixtureSetPath: fixtureSet.path }
}

async function rebuildSeasonFixtureIndexEndpoint(seasonId: string) {
  const season = await load<Season>(entityPath('season', seasonId))
  const status = await rebuildSeasonFixtureIndex(season)

  return {
    seasonId,
    fixtureSetCount: status.fixtureSetCount,
  }
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
    throw new Error('DeepSeek did not return a fixture set results summary')
  }

  return {
    fixtureSetPath: fixtureSet.path,
    resultsSummary: { id: summaryText.id, path: summaryText.path },
    resultsSummaryText: summaryText.text,
    resultsSummaryGeneratedAt: fixtureSet.resultsSummaryGeneratedAt,
    resultsSummaryModel: fixtureSet.resultsSummaryModel,
  }
}

function regenerateRoundup(req: Request, res: Response) {
  return send(regenerateCompetitionRoundupResponse(parseBody<RegenerateRoundupCommand>(req)), res)
}

interface RegenerateRoundupCommand {
  competitionPath: string
}

async function regenerateCompetitionRoundupResponse(command: RegenerateRoundupCommand) {
  const competition = await regenerateCompetitionRoundup(command.competitionPath)
  const roundupText = competition.roundup ? await load<Text>(competition.roundup) : undefined

  if (!roundupText?.text?.trim()) {
    throw new Error('DeepSeek did not return a competition roundup')
  }

  return {
    competitionPath: competition.path,
    roundup: { id: roundupText.id, path: roundupText.path },
    roundupText: roundupText.text,
    roundupGeneratedAt: competition.roundupGeneratedAt,
    roundupModel: competition.roundupModel,
  }
}

function parseBody<T>(req: Request) {
  return (typeof req.body === 'string' ? JSON.parse(req.body) : req.body) as T
}
