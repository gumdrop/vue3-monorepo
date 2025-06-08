import { describe, it, expect } from 'vitest'
import { LeagueTable } from '../../entity/LeagueTable'
import { Fixture } from '../../entity/Fixtures'
import { recalculateTables } from '../LeagueTableRecalculator'

const table1: LeagueTable = {
  path: 'table/1',
  id: '1',
  rows: [
    {
      team: { path: 'team/1', id: '1' },
      position: '',
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      leaguePoints: 0,
      matchPointsAgainst: 0,
      matchPointsFor: 0,
    },
    {
      team: { path: 'team/2', id: '2' },
      position: '',
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      leaguePoints: 0,
      matchPointsAgainst: 0,
      matchPointsFor: 0,
    },
  ],
}

const table2: LeagueTable = {
  path: 'table/2',
  id: '2',
  rows: [
    {
      team: { path: 'team/3', id: '3' },
      position: '',
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      leaguePoints: 0,
      matchPointsAgainst: 0,
      matchPointsFor: 0,
    },
    {
      team: { path: 'team/4', id: '4' },
      position: '',
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      leaguePoints: 0,
      matchPointsAgainst: 0,
      matchPointsFor: 0,
    },
  ],
}

const homeWin: Fixture = {
  away: { path: 'team/2', id: '2' },
  home: { path: 'team/1', id: '1' },
  result: { awayScore: 10, homeScore: 20 },
  path: 'fixture/1',
  id: '1',
}

const draw: Fixture = {
  away: { path: 'team/2', id: '2' },
  home: { path: 'team/1', id: '1' },
  result: { awayScore: 20, homeScore: 20 },
  path: 'fixture/1',
  id: '1',
}

const crossTableHomeWin: Fixture = {
  away: { path: 'team/3', id: '3' },
  home: { path: 'team/1', id: '1' },
  result: { awayScore: 10, homeScore: 20 },
  path: 'fixture/1',
  id: '1',
}

describe('League Table Recalculator', () => {
  describe('Single table', () => {
    it('should calculate a single home win correctly', () => {
      const recalculated = recalculateTables([table1], [homeWin])
      expect(recalculated.length).toBe(1)

      const recal = recalculated[0]
      expect(recal.rows.length).toBe(2)

      const row1 = recal.rows[0]
      const row2 = recal.rows[1]

      expect(row1.team.id).toBe('1')
      expect(row1.position).toBe('1')
      expect(row1.won).toBe(1)
      expect(row1.lost).toBe(0)
      expect(row1.drawn).toBe(0)
      expect(row1.leaguePoints).toBe(2)
      expect(row1.matchPointsAgainst).toBe(10)
      expect(row1.matchPointsFor).toBe(20)

      expect(row2.team.id).toBe('2')
      expect(row2.position).toBe('2')
      expect(row2.won).toBe(0)
      expect(row2.lost).toBe(1)
      expect(row2.drawn).toBe(0)
      expect(row2.leaguePoints).toBe(0)
      expect(row2.matchPointsAgainst).toBe(20)
      expect(row2.matchPointsFor).toBe(10)
    })

    it('should calculate a win then a draw correctly', () => {
      const recalculated = recalculateTables([table1], [homeWin, draw])
      expect(recalculated.length).toBe(1)

      const recal = recalculated[0]
      expect(recal.rows.length).toBe(2)

      const row1 = recal.rows[0]
      const row2 = recal.rows[1]

      expect(row1.team.id).toBe('1')
      expect(row1.position).toBe('1')
      expect(row1.won).toBe(1)
      expect(row1.lost).toBe(0)
      expect(row1.drawn).toBe(1)
      expect(row1.leaguePoints).toBe(3)
      expect(row1.matchPointsAgainst).toBe(30)
      expect(row1.matchPointsFor).toBe(40)

      expect(row2.team.id).toBe('2')
      expect(row2.position).toBe('2')
      expect(row2.won).toBe(0)
      expect(row2.lost).toBe(1)
      expect(row2.drawn).toBe(1)
      expect(row2.leaguePoints).toBe(1)
      expect(row2.matchPointsAgainst).toBe(40)
      expect(row2.matchPointsFor).toBe(30)
    })
  })

  describe('Multiple Tables', () => {
    it('should calculate a cross-table home win correctly', () => {
      const recalculated = recalculateTables([table1, table2], [crossTableHomeWin])

      expect(recalculated.length).toBe(2)

      const recal1 = recalculated[0]
      expect(recal1.rows.length).toBe(2)

      const recal2 = recalculated[1]
      expect(recal2.rows.length).toBe(2)

      const [row1, row2] = recal1.rows
      const [row3, row4] = recal2.rows

      expect(row1.team.id).toBe('1')
      expect(row1.position).toBe('1')
      expect(row1.won).toBe(1)
      expect(row1.lost).toBe(0)
      expect(row1.drawn).toBe(0)
      expect(row1.leaguePoints).toBe(2)
      expect(row1.matchPointsAgainst).toBe(10)
      expect(row1.matchPointsFor).toBe(20)

      expect(row2.team.id).toBe('2')
      expect(row2.position).toBe('2')
      expect(row2.won).toBe(0)
      expect(row2.lost).toBe(0)
      expect(row2.drawn).toBe(0)
      expect(row2.leaguePoints).toBe(0)
      expect(row2.matchPointsAgainst).toBe(0)
      expect(row2.matchPointsFor).toBe(0)

      expect(row3.team.id).toBe('3')
      expect(row3.position).toBe('1')
      expect(row3.won).toBe(0)
      expect(row3.lost).toBe(1)
      expect(row3.drawn).toBe(0)
      expect(row3.leaguePoints).toBe(0)
      expect(row3.matchPointsAgainst).toBe(20)
      expect(row3.matchPointsFor).toBe(10)


      expect(row4.team.id).toBe('4')
      expect(row4.position).toBe('2')
      expect(row4.won).toBe(0)
      expect(row4.lost).toBe(0)
      expect(row4.drawn).toBe(0)
      expect(row4.leaguePoints).toBe(0)
      expect(row4.matchPointsAgainst).toBe(0)
      expect(row4.matchPointsFor).toBe(0)

    })
  })
})
