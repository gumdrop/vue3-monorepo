import { Season, Text } from '@quizleague/shared'
import { Application, Request, Response } from 'express'
import { entityPath, load } from '../storage/Storage'
import { regenerateCompetitionRoundup, regenerateFixtureSetResultsSummary } from './TaskFunctions'
import { migrateTeamMemberships } from './TeamMembershipMigration'
import { calculateStats } from './StatisticsUtils'
import { recalculateSeasonStatisticsAggregation } from './SeasonStatisticsAggregationUtils'
import { rebuildSeasonResultIndex } from './ResultIndexUtils'
import { param, send } from './util'

const root = '/rest/maintain'

export default function configureMaintain(app: Application) {
  app
    .post(`${root}/season/:seasonId/statistics/recalculate`, recalculateSeasonStatistics)
    .post(
      `${root}/season/:seasonId/statistics/aggregation/recalculate`,
      recalculateSeasonStatisticsAggregationEndpoint,
    )
    .post(`${root}/season/:seasonId/result-index/rebuild`, rebuildResultIndex)
    .post(`${root}/team-members/migrate`, migrateTeamMembers)
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

function rebuildResultIndex(req: Request, res: Response) {
  return send(rebuildSeasonResultIndexEndpoint(param('seasonId', req)), res)
}

async function rebuildSeasonResultIndexEndpoint(seasonId: string) {
  const season = await load<Season>(entityPath('season', seasonId))
  const status = await rebuildSeasonResultIndex(season)

  return {
    seasonId,
    fixtureSetCount: status.fixtureSetCount,
  }
}

function migrateTeamMembers(_req: Request, res: Response) {
  return send(migrateTeamMemberships(), res)
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
    throw new Error('Gemini did not return a competition roundup')
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
