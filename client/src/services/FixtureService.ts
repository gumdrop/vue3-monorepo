import ApplicationContextDAO from '@/dao/ApplicationContextDAO'
import FixturesDAO, { fixtureDAO } from '@/dao/FixturesDAO'
import type Fixtures from '@/entity/Fixtures'
import type { Fixture, Result } from '@/entity/Fixtures'
import { LocalDateTime } from '@js-joda/core'
import { DocumentReference } from 'firebase/firestore'
import { useFixtures } from './FixturesService'
import axios from 'axios'

export const useFixture = () => {
  const getAppContext = () => ApplicationContextDAO.getData(ApplicationContextDAO.get())

  const fixtureList = async (fixtures: Fixtures[]) => {
    const fixtureSet: Fixture[] = []

    for (const fixs of fixtures) {
      ;(await fixtureDAO.entities(fixtureDAO.subCollection(`${fixs.path}`))).forEach((f) =>
        fixtureSet.push(f),
      )
    }

    return fixtureSet
  }

  const fixturesForResultSubmission = async (teamId: string | undefined) => {
    const now = LocalDateTime.now().toString()

    const appContext = await getAppContext()

    const { seasonFixtures } = useFixtures()

    const fixtures = (await seasonFixtures(`${appContext?.currentSeason.id}`))
      .sort((b, a) => a.date.localeCompare(b.date))
      .filter((f) => now >= `${f.date}T${f.start}`)

    const fixtureSet = await fixtureList(fixtures)

    return fixtureSet
      .filter((f) => f.home.id == teamId || f.away.id == teamId)
      .slice(0, 1)
      .map((f) => fixtureDAO.getByPath(f.path))
  }

  const teamFixtureSet = async (
    teamId: string,
    seasonId: string,
    fetchFn: (seasonId: string) => Promise<DocumentReference<Fixtures>[]>,
    take?: number,
  ) => {
    const fixtures = await FixturesDAO.entityList(await fetchFn(seasonId))

    const fixtureSet = !fixtures ? [] : await fixtureList(fixtures)

    return fixtureSet
      .filter((f) => f.home.id == teamId || f.away.id == teamId)
      .slice(0, take)
      .map((f) => fixtureDAO.getByPath(f.path))
  }

  const teamFixtures = async (teamId: string, take?: number) => {
    const appContext = await getAppContext()

    const { activeFixtures } = useFixtures()

    return teamFixtureSet(teamId, `${appContext?.currentSeason.id}`, activeFixtures, take)
  }

  const teamResults = async (teamId: string, seasonId: string, take?: number) => {
    const { spentFixtures } = useFixtures()

    return teamFixtureSet(teamId, seasonId, spentFixtures, take)
  }

  const submitResult = (
    fixtureId: string,
    userId: string,
    result?: Result,
    reportText?: string,
  ) => {
    axios.post(
      '/result/submit',
      { fixtureDAO, userId, result, reportText },
      { headers: { 'Content-type': 'application/json' } },
    )
  }

  return { fixturesForResultSubmission, teamFixtures, teamResults, fixtureList, submitResult }
}

// def fixturesForResultSubmission(teamId:String) = {
//   val now = LocalDateTime.now().toString

//   val context = ApplicationContextService.get()

//   val fixtures = context.flatMap(c => {
//     val fixturesSet = FixturesService
//       .competitionFixtures(CompetitionService.competitions(c.currentSeason.id).map(_.sortBy(_.subsidiary)))
//         .map(_
//           .filter(f => now >= s"${f.date}T${f.start}")
//           .sortBy(_.date)(Desc))
//     fixturesFrom(fixturesSet, teamId, 4, Desc)
//   })

//   fixtures
//     .map(_.map(f => f.parent.map(fs => (fs,f))))
//     .flatMap(x => combineLatest(x.toSeq))
//     .map(_.groupBy(_._1.date)
//     .toList
//     .sortBy(_._1)(Desc)
//     .take(1)
//     .flatMap(_._2)
//     .map(_._2)
//     .toJSArray)
// }
