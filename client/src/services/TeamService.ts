import ApplicationContextDAO from '@/dao/ApplicationContextDAO'
import LeagueTableDAO from '@/dao/LeagueTableDAO'
import SeasonDAO from '@/dao/SeasonDAO'
import type Competition from '@/entity/Competition'
import type Fixtures from '@/entity/Fixtures'
import type Season from '@/entity/Season'
import type Statistics from '@/entity/Statisitics'
import type { WeekStats } from '@/entity/Statisitics'
import { useCompetitions } from './CompetitionService'
import { useDateTime } from './DateService'
import { useFixture } from './FixtureService'
import StatisticsDAO from '@/dao/StatisticsDAO'
import TeamDAO from '@/dao/TeamDAO'
import type Team from '@/entity/Team'

const { date } = useDateTime()

export const useTeams = () => {
  const leagueStanding = async (teamId: string) => {
    const { firstClassCompetitions } = useCompetitions()
    const appContext = await ApplicationContextDAO.getAppContext()
    const competitions = await firstClassCompetitions(`${appContext?.currentSeason.id}`)
    const league = competitions.find((f) => f._name == 'league')
    const ordinal = (position: string) => {
      let suffix = ''

      switch (position) {
        case '1':
          suffix = 'st'
          break
        case '2':
          suffix = 'nd'
          break
        case '3':
          suffix = 'rd'
          break
        default:
          suffix = 'th'
      }

      return `${position}${suffix}`
    }

    if (!league) return []

    const tables = await LeagueTableDAO.entities(LeagueTableDAO.subCollection(`${league.key}`))

    return tables
      .map((t) =>
        t.rows
          .filter((r) => r.team.id == teamId)
          .map((r) => {
            return { name: `League ${t.description}`, standing: ordinal(r.position) }
          }),
      )
      .flatMap((s) => s)
  }

  const cupStanding = async (teamId: string) => {
    const { firstClassCompetitions, fixtures } = useCompetitions()
    const { fixtureList } = useFixture()
    const appContext = await ApplicationContextDAO.getAppContext()
    const competitions = await firstClassCompetitions(`${appContext?.currentSeason.id}`)
    const cups = competitions.filter((f) => f._name == 'cup')

    const fixtureGroup: { fixtures: Fixtures; competition: Competition }[] = []

    for (const cup of cups) {
      const fixs = await fixtures(`${cup.key}`)

      for (const fix of fixs) {
        const fixture = (await fixtureList([fix])).find(
          (f) => f.home.id == teamId || f.away.id == teamId,
        )
        if (fixture) {
          fixtureGroup.push({ fixtures: fix, competition: cup })
        }
      }
    }

    return fixtureGroup
      .sort((a, b) => b.fixtures.date.localeCompare(a.fixtures.date))
      .slice(0, 1)
      .map((f) => {
        return { name: f.competition.name, standing: f.fixtures.description }
      })
  }

  const standings = async (teamId: string) =>
    (await leagueStanding(teamId)).concat(await cupStanding(teamId))

  const formatDate = (dateVal: string) => date(dateVal, 'd MMM')

  const positionData = (stats: Statistics) => {
    const dataPoints = sortedWeekStats(stats)

    return {
      datasets: [
        {
          data: dataPoints.map(([, ws]) => ws.leaguePosition),
          lineTension: 0.2,
          yAxisId: 'y',
        },
      ],
      labels: dataPoints.map(([key]) => formatDate(key)),
    }
  }

  const matchScoresData = (stats: Statistics) => {
    const dataPoints = sortedWeekStats(stats)
    return {
      datasets: [
        {
          label: 'For',
          data: dataPoints.map(([, ws]) => ws.pointsFor),
          lineTension: 0.2,
          yAxisId: 'y',
          fill: true,
          backgroundColor: 'rgba(150,150,150,.5)',
          borderColor: 'rgba(50,50,50,1)',
        },
        {
          label: 'Against',
          data: dataPoints.map(([, ws]) => ws.pointsAgainst),
          lineTension: 0.2,
          yAxisId: 'y',
          fill: true,
          backgroundColor: 'rgba(150,150,150,.7)',
          borderColor: 'red',
        },
      ],
      labels: dataPoints.map(([key]) => formatDate(key)),
    }
  }

  const cumulativeScoresData = (stats: Statistics) => {
    const dataPoints = sortedWeekStats(stats)
    return {
      datasets: [
        {
          label: 'For',
          data: dataPoints.map(([, ws]) => ws.cumuPointsFor),
          lineTension: 0.2,
          yAxisId: 'y',
          fill: true,
          backgroundColor: 'rgba(150,150,150,.5)',
          borderColor: 'rgba(50,50,50,1)',
        },
        {
          label: 'Against',
          data: dataPoints.map(([, ws]) => ws.cumuPointsAgainst),
          lineTension: 0.2,
          yAxisId: 'y',
          fill: true,
          backgroundColor: 'rgba(150,150,150,.7)',
          borderColor: 'red',
        },
      ],
      labels: dataPoints.map(([key]) => formatDate(key)),
    }
  }

  const cumulativePointsDifferenceData = (stats: Statistics) => {
    const dataPoints = sortedWeekStats(stats)
    return {
      datasets: [
        {
          label: 'Difference',
          data: dataPoints.map(([, ws]) => ws.cumuPointsDifference),
          lineTension: 0.2,
          yAxisId: 'y',
          backgroundColor: 'rgba(150,150,150,.5)',
          borderColor: 'rgba(50,50,50,1)',
        },
      ],
      labels: dataPoints.map(([key]) => formatDate(key)),
    }
  }

  const singleSeasonResultTypes = (stats: Statistics) => {
    const dataPoints = sortedWeekStats(stats).map(([, x]) => x)

    const wins = dataPoints.filter((x) => x.pointsFor > x.pointsAgainst).length
    const draws = dataPoints.filter((x) => x.pointsFor == x.pointsAgainst).length
    const losses = dataPoints.filter((x) => x.pointsFor < x.pointsAgainst).length

    return {
      datasets: [
        {
          data: [wins, draws, losses],
          backgroundColor: ['green', 'blue', 'red'],
          hoverBackgroundColor: ['rgb(0,200,0,1)', 'rgb(0,0,200,1)', 'rgb(200,0,0,1)'],
          borderWidth: 1,
          fill: true,
          borderColor: 'white',
        },
      ],
      labels: ['Won', 'Drawn', 'Lost'],
    }
  }

  const allSeasonsResultTypes = (stats: Statistics[]) => {
    const dataPoints = stats
      .map((stat) => sortedWeekStats(stat).map(([, x]) => x))
      .flatMap((x) => x)

    const wins = dataPoints.filter((x) => x.pointsFor > x.pointsAgainst).length
    const draws = dataPoints.filter((x) => x.pointsFor == x.pointsAgainst).length
    const losses = dataPoints.filter((x) => x.pointsFor < x.pointsAgainst).length

    return {
      datasets: [
        {
          data: [wins, draws, losses],
          backgroundColor: ['green', 'blue', 'red'],
          hoverBackgroundColor: ['rgb(0,200,0,1)', 'rgb(0,0,200,1)', 'rgb(200,0,0,1)'],
          borderWidth: 1,
          fill: true,
          borderColor: 'white',
        },
      ],
      labels: ['Won', 'Drawn', 'Lost'],
    }
  }

  const sortStats = (stats: Statistics[], seasons: Season[]) => {
    return stats.sort((a, b) => {
      const ayear = seasons.find((s) => a.season.id == s.id)?.startYear
      const byear = seasons.find((s) => b.season.id == s.id)?.startYear
      return ayear && byear ? ayear - byear : 0
    })
  }

  const formatSeason = (season: Season) => `${season.startYear}/${('' + season.endYear).slice(2)}`

  const allSeasonsPositionData = async (stats: Statistics[]) => {
    const seasons = await SeasonDAO.entities(SeasonDAO.collection())

    const sortedStats = sortAndPadStats(stats, seasons)

    const data = sortedStats.map((x) =>
      !x.seasonStats || !x.seasonStats.currentLeaguePosition
        ? null
        : x.seasonStats.currentLeaguePosition,
    )

    return {
      datasets: [{ data, lineTension: 0.2 }],
      labels: seasons.map(formatSeason).sort((a, b) => a.localeCompare(b)),
    }
  }

  const teamCount = async (stats: Statistics) => {
    let tableRows = 0

    try {
      const table = await LeagueTableDAO.getDataByPath(stats.table.path)
      tableRows = table?.rows.length ?? 0
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (e) {}

    const seasonStatistics = await StatisticsDAO.entities(StatisticsDAO.seasonStats(stats.season.id))

    return Math.max(tableRows, seasonStatistics.length)
  }

  const teamCountAllSeasons = async (stats: Statistics[]) => {
    let retval = 0
    for (const stat of stats) {
      try {
        const count = await teamCount(stat)
        if (count) {
          retval = retval > count ? retval : count
        }
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (e) {}
    }
    return retval
  }

  const sortAndPadStats = (stats: Statistics[], seasons: Season[]) => {
    const padded = seasons
      .sort((a, b) => a.startYear - b.startYear)
      .map((s) => {
        const stat = stats.find((stat) => stat.season.id == s.id)

        return stat ? stat : ({ season: { id: s.id } } as Statistics)
      })

    return padded
  }

  const allSeasonsAverageData = async (stats: Statistics[]) => {
    const seasons = await SeasonDAO.entities(SeasonDAO.collection())

    const sortedStats = sortAndPadStats(stats, seasons)

    const fixCount = (weekStats: WeekStats[]) => weekStats.filter((ws) => !ws.ignorable).length

    return {
      datasets: [
        {
          label: 'Average For',
          data: sortedStats.map((s) =>
            s.seasonStats
              ? s.seasonStats.runningPointsFor / fixCount(Object.values(s.weekStats))
              : null,
          ),
          lineTension: 0.2,
          fill: true,
          borderColor: 'rgba(50,50,50,1)',
          backgroundColor: 'rgba(150,150,150,.5',
        },
        {
          label: 'Average Against',
          data: sortedStats.map((s) =>
            s.seasonStats
              ? s.seasonStats.runningPointsAgainst / fixCount(Object.values(s.weekStats))
              : null,
          ),
          lineTension: 0.2,
          fill: true,
          borderColor: 'red',
          backgroundColor: 'rgba(150,150,150,.7',
        },
      ],
      labels: seasons.map(formatSeason).sort((a, b) => a.localeCompare(b)),
    }
  }

  const allSeasonsMultipleTeamStats = async (teams: string[]) => {
    const seasons = await SeasonDAO.entities(SeasonDAO.collection())

    const retval: Statistics[][] = []

    for (const teamId of teams) {
      retval.push(
        sortStats(await StatisticsDAO.entities(StatisticsDAO.allTeamStats(teamId)), seasons),
      )
    }

    return retval
  }

  const multipleTeamsAllSeasonsGraphData = async (
    stats: Statistics[][],
    statsMapFn: (stats: Statistics) => number | null,
  ) => {
    const seasons = await SeasonDAO.entities(SeasonDAO.collection())

    const randomColor = () => Math.random() * 255 - 63

    const datasets = []

    for (const stat of stats) {
      const sortedStats = sortAndPadStats(stat, seasons)
      const teamId = sortedStats.find((s) => s.team !== undefined)?.team.id
      const team = await TeamDAO.getDataById(teamId as string)
      const data = sortedStats.map(statsMapFn)
      const colour = `rgba(${randomColor()},${randomColor()},${randomColor()}, 1)`

      datasets.push({
        label: team?.shortName,
        data,
        lineTension: 0.2,
        borderColor: colour,
        backgroundColor: colour,
      })
    }

    return {
      datasets,
      labels: seasons.map(formatSeason).sort((a, b) => a.localeCompare(b)),
    }
  }

  const multipleTeamsAllSeasonsPositionData = (stats: Statistics[][]) => {
    const mapFn = (x: Statistics) =>
      x.seasonStats
        ? !x.seasonStats.currentLeaguePosition
          ? null
          : x.seasonStats.currentLeaguePosition
        : null

    return multipleTeamsAllSeasonsGraphData(stats, mapFn)
  }

  const multipleTeamsAllSeasonsAverageData = async (stats: Statistics[][]) => {
    const fixCount = (weekStats: WeekStats[]) => weekStats.filter((ws) => !ws.ignorable).length
    const mapFn = (x: Statistics) =>
      x.seasonStats ? x.seasonStats.runningPointsFor / fixCount(Object.values(x.weekStats)) : null

    return multipleTeamsAllSeasonsGraphData(stats, mapFn)
  }

  const headToHeadResultsData = async (stats: Statistics[][]) => {
    const results: { team: string; win: number; draw: number; lose: number }[] = []

    const primary = stats[0]

    for (const oppo of stats.slice(1)) {
      const oppoId = oppo[0].team.id
      const total = { win: 0, draw: 0, lose: 0 }
      const team = (await TeamDAO.getDataById(oppoId)) as Team
      const h2hs = primary
        .filter((s) => s.seasonStats && s.seasonStats.headToHead)
        .flatMap((s) => s.seasonStats.headToHead.filter((h) => h.team.id == oppoId))
        .reduce((runningTotal, h2h) => {
          return {
            win: runningTotal.win + h2h.win,
            draw: runningTotal.draw + h2h.draw,
            lose: runningTotal.lose + h2h.lose,
          }
        }, total)
      results.push({ team: team?.shortName, ...h2hs })
    }

    return results
  }

  async function teamForUser(userId: string | undefined) {
    return (await TeamDAO.list())?.find((t) => t.users.find((u) => u.id === userId))
  }

  return {
    standings,
    positionData,
    matchScoresData,
    teamCount,
    teamCountAllSeasons,
    cumulativeScoresData,
    cumulativePointsDifferenceData,
    singleSeasonResultTypes,
    allSeasonsPositionData,
    allSeasonsResultTypes,
    allSeasonsAverageData,
    allSeasonsMultipleTeamStats,
    multipleTeamsAllSeasonsPositionData,
    multipleTeamsAllSeasonsAverageData,
    headToHeadResultsData,
    teamForUser,
  }
}
function sortedWeekStats(stats: Statistics) {
  return Object.entries(stats.weekStats)
    .filter(([, ws]) => !ws.ignorable)
    .sort(([a], [b]) => a.localeCompare(b))
}
