import FixturesDAO from '@/dao/FixturesDAO'
import type Competition from '@/entity/Competition'
import Fixtures from '@/entity/Fixtures'
import { useCompetitions } from './CompetitionService'
import { currentLocalDate } from './DateService'
import { completedFixtureSets } from './FixtureSetCompletion'
const { fixtures, firstClassCompetitions } = useCompetitions()

export type QuestionPaper = {
  fixtures: Fixtures
  competition: Competition
}

export const useFixtures = () => {
  const activeFixtures = async (seasonId: string, take?: number) => {
    const today = currentLocalDate().toString()
    return (await seasonFixtures(seasonId))
      .filter((f) => f.date >= today)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, take)
      .map((f) => FixturesDAO.getByPath(`${f.path}`))
  }

  const spentFixtures = async (seasonId: string, take?: number) => {
    const today = currentLocalDate().toString()
    return (
      await completedFixtureSets((await seasonFixtures(seasonId)).filter((f) => f.date <= today))
    )
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, take)
      .map((f) => FixturesDAO.getByPath(`${f.path}`))
  }

  const questionPapers = async (seasonId: string) => {
    const competitions = await firstClassCompetitions(seasonId)
    const questions: QuestionPaper[] = []
    for (const competition of competitions) {
      ;(await fixtures(`${competition.path}`))
        .filter((fixtures) => fixtures.questionsUrl?.trim())
        .forEach((fixtureSet) => questions.push({ fixtures: fixtureSet, competition }))
    }
    return questions.sort((a, b) => b.fixtures.date.localeCompare(a.fixtures.date))
  }

  const seasonFixtures = async (seasonId: string) => {
    const competitions = await firstClassCompetitions(seasonId)

    return competitionFixtures(competitions)
  }

  const competitionFixtures = async (competitions: Competition[]) => {
    const interim: Fixtures[] = []
    for (const competition of competitions) {
      ;(await fixtures(`${competition.path}`)).forEach((f) => interim.push(f))
    }
    return interim
  }

  return { activeFixtures, questionPapers, seasonFixtures, spentFixtures }
}

// def activeFixtures(seasonId: String, take:Int = Integer.MAX_VALUE) = {
//   val today = LocalDate.now.toString()

//   seasonFixtures(seasonId).map(_.filter(_.date >= today).sortBy(_.date).take(take))
// }

// def spentFixtures(seasonId: String, take:Int = Integer.MAX_VALUE) = {
//   val today = LocalDate.now.toString()

//   seasonFixtures(seasonId).map(_.filter(_.date <= today).sortBy(_.date)(Desc).take(take))
// }

// private def seasonFixtures(seasonId:String) = {
//   competitionFixtures(CompetitionService.firstClassCompetitions(seasonId))
// }

// def competitionFixtures(competitions:Observable[js.Array[? <: Competition]]):Observable[js.Array[Fixtures]] = {
//   val interim = competitions.map(_.map(c => FixturesService.list(c.path)))

//   interim.flatMap(o => combineLatest(o.toSeq).map(_.toJSArray.flatten))
// }
