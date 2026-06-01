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
        won: row1.won + row2.won,
        lost: row1.lost + row2.lost,
        drawn: row1.drawn + row2.drawn,
        leaguePoints: row1.leaguePoints + row2.leaguePoints,
        matchPointsFor: row1.matchPointsFor + row2.matchPointsFor,
        matchPointsAgainst: row1.matchPointsAgainst + row2.matchPointsAgainst,
        played: row1.played + row2.played,
      }
    }

    return (table: LeagueTable) => {
      function compareRows(a: LeagueTableRow, b: LeagueTableRow) {
        return (
          b.leaguePoints - a.leaguePoints ||
          b.matchPointsFor - a.matchPointsFor ||
          a.matchPointsAgainst - b.matchPointsAgainst ||
          b.won - a.won ||
          b.drawn - a.drawn
        )
      }

      const newRows = table.rows
        .map((r) => {
          const filtered = rows.filter((row) => row.team.id === r.team.id)
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
