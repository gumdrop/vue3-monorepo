import type { Fixture } from '../entity/Fixtures'
import type { LeagueTable, LeagueTableRow } from '../entity/LeagueTable'

export function recalculateTables(tables: LeagueTable[], fixtures: Fixture[]): LeagueTable[] {
  function makeRows(fixture: Fixture): LeagueTableRow[] {
    if (fixture.result) {
      const result = fixture.result
      const homeWin = result.homeScore > result.awayScore ? 1 : 0
      const awayWin = result.homeScore < result.awayScore ? 1 : 0
      const draw = result.homeScore === result.awayScore ? 1 : 0

      return [
        {
          team: fixture.home,
          position: '',
          won: homeWin,
          lost: awayWin,
          drawn: draw,
          leaguePoints: homeWin * 2 + draw,
          matchPointsFor: result.homeScore,
          matchPointsAgainst: result.awayScore,
          played: 1,
        },
        {
          team: fixture.away,
          position: '',
          won: awayWin,
          lost: homeWin,
          drawn: draw,
          leaguePoints: awayWin * 2 + draw,
          matchPointsFor: result.awayScore,
          matchPointsAgainst: result.homeScore,
          played: 1,
        },
      ]
    }

    return []
  }

  function applyRows(rows: LeagueTableRow[]) {
    function addRows(row1: LeagueTableRow, row2: LeagueTableRow): LeagueTableRow {
      return {
        team: row1.team,
        position: '',
        won: (Number(row1.won) || 0) + (Number(row2.won) || 0),
        lost: (Number(row1.lost) || 0) + (Number(row2.lost) || 0),
        drawn: (Number(row1.drawn) || 0) + (Number(row2.drawn) || 0),
        leaguePoints: (Number(row1.leaguePoints) || 0) + (Number(row2.leaguePoints) || 0),
        matchPointsFor: (Number(row1.matchPointsFor) || 0) + (Number(row2.matchPointsFor) || 0),
        matchPointsAgainst: (Number(row1.matchPointsAgainst) || 0) + (Number(row2.matchPointsAgainst) || 0),
        played: (Number(row1.played) || 0) + (Number(row2.played) || 0),
      }
    }

    return (table: LeagueTable) => {
      function compareRows(a: LeagueTableRow, b: LeagueTableRow) {
        const bPts = Number(b.leaguePoints) || 0
        const aPts = Number(a.leaguePoints) || 0
        const bFor = Number(b.matchPointsFor) || 0
        const aFor = Number(a.matchPointsFor) || 0
        const aAgainst = Number(a.matchPointsAgainst) || 0
        const bAgainst = Number(b.matchPointsAgainst) || 0
        const bWon = Number(b.won) || 0
        const aWon = Number(a.won) || 0
        const bDrawn = Number(b.drawn) || 0
        const aDrawn = Number(a.drawn) || 0

        return (
          bPts - aPts ||
          bFor - aFor ||
          aAgainst - bAgainst ||
          bWon - aWon ||
          bDrawn - aDrawn
        )
      }

      const newRows = table.rows
        .map((r) => {
          const filtered = rows.filter((row) => Boolean(row.team?.id) && row.team?.id === r.team?.id)
          return filtered.reduce((a, b) => addRows(a, b), r)
        })
        .sort(compareRows)
        .map((row, i) => {
          return { ...row, position: `${i + 1}` }
        })
      return { ...table, rows: newRows }
    }
  }

  const rows = fixtures.flatMap(makeRows)

  return tables.map(applyRows(rows))
}
