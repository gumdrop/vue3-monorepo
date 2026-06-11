import CompetitionDAO from '@/dao/CompetitionDAO'
import FixturesDAO from '@/dao/FixturesDAO'
import LeagueTableDAO from '@/dao/LeagueTableDAO'
import ResultIndexDAO from '@/dao/ResultIndexDAO'
import SeasonDao from '@/dao/SeasonDAO'
import TextDAO from '@/dao/TextDAO'
import type Competition from '@/entity/Competition'
import type { name } from '@/entity/Competition'
import type Text from '@/entity/Text'
import { currentLocalDate } from './DateService'
import { completedFixtureSets } from './FixtureSetCompletion'

export interface CompetitionRoundup {
  competition: Competition
  text: Text
}

const isTeamCompetition = (competition: Competition) => competition._name !== 'singleton'

export const useCompetitions = () => {
  async function competitions(seasonId: string) {
    const season = SeasonDao.getById(seasonId)
    return (await CompetitionDAO.entities(CompetitionDAO.nestedCollection(season))).sort((a, b) =>
      a.name.localeCompare(b.name),
    )
  }

  async function firstClassCompetitions(seasonId: string) {
    return (await competitions(seasonId)).filter((c) => c._name != 'subsidiary')
  }

  async function fixtures(competitionPath: string) {
    return await FixturesDAO.entities(FixturesDAO.subCollection(competitionPath))
  }

  async function nextFixtures(competitionPath: string, take: number | undefined = undefined) {
    const today = currentLocalDate().toString()
    return (await fixtures(competitionPath))
      .filter((f) => f.date >= today)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, take)
      .map((f) => FixturesDAO.getByPath(`${f.path}`))
  }

  async function latestResults(competitionPath: string, take: number | undefined = undefined) {
    const resultIndexFixtures = await ResultIndexDAO.competitionFixtureSetDocuments(
      competitionPath,
      take,
    )
    if (resultIndexFixtures) return resultIndexFixtures

    const today = currentLocalDate().toString()
    return (
      await completedFixtureSets((await fixtures(competitionPath)).filter((f) => f.date <= today))
    )
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, take)
      .map((f) => FixturesDAO.getByPath(f.path))
  }

  async function roundups(seasonId: string) {
    const roundupItems: CompetitionRoundup[] = []

    for (const competition of (await competitions(seasonId)).filter(isTeamCompetition)) {
      if (!competition.roundup) continue

      const text = await TextDAO.getData(competition.roundup)
      if (text?.text?.trim()) {
        roundupItems.push({ competition, text })
      }
    }

    return roundupItems.sort((a, b) => a.competition.name.localeCompare(b.competition.name))
  }

  function leagueTables(competitionPath: string) {
    const doc = CompetitionDAO.getByPath(competitionPath)
    return LeagueTableDAO.nestedCollection(doc)
  }

  async function competitionOfType<T extends Competition>(seasonId: string, name: name) {
    return (await competitionsOfType<T>(seasonId, name)).reduce((prev, current) => current)
  }

  async function competitionsOfType<T extends Competition>(seasonId: string, name: name) {
    return (await firstClassCompetitions(seasonId)).filter((c) => c._name == name) as T[]
  }

  return {
    competitions,
    firstClassCompetitions,
    nextFixtures,
    latestResults,
    roundups,
    leagueTables,
    fixtures,
    competitionOfType,
    competitionsOfType,
  }
}
