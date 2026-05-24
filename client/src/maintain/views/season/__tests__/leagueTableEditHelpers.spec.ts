import { describe, expect, it } from 'vitest'
import type LeagueTable from '@/entity/LeagueTable'
import type { LeagueTableRow } from '@/entity/LeagueTable'
import type Team from '@/entity/Team'
import {
  availableTeamsForLeagueTableRow,
  createEmptyLeagueTableRow,
  leagueTableForSave,
  setLeagueTableRowTeam,
  unallocatedLeagueTableTeams,
} from '../leagueTableEditHelpers'

const team = (id: string): Team =>
  ({
    id,
    path: `team/${id}`,
    name: id,
    shortName: id,
    venue: { id: `${id}-venue`, path: `venue/${id}-venue` },
    text: { id: `${id}-text`, path: `text/${id}-text` },
    users: [],
    retired: false,
  }) as Team

const row = (teamId: string): LeagueTableRow => ({
  team: { id: teamId, path: teamId ? `team/${teamId}` : '' },
  position: '',
  played: 0,
  won: 0,
  lost: 0,
  drawn: 0,
  leaguePoints: 0,
  matchPointsFor: 0,
  matchPointsAgainst: 0,
})

describe('league table edit helpers', () => {
  const teams = [team('alpha'), team('bravo'), team('charlie')]

  it('returns teams not allocated to any row', () => {
    const table = { rows: [row('alpha'), row('bravo')] } as LeagueTable

    expect(unallocatedLeagueTableTeams(teams, table).map((t) => t.id)).toEqual(['charlie'])
  })

  it('keeps the current row team selectable while excluding teams allocated to other rows', () => {
    const rows = [row('alpha'), row('bravo')]

    expect(availableTeamsForLeagueTableRow(teams, rows, 0).map((t) => t.id)).toEqual(['alpha', 'charlie'])
    expect(availableTeamsForLeagueTableRow(teams, rows, 1).map((t) => t.id)).toEqual(['bravo', 'charlie'])
  })

  it('creates an empty row with zero statistics', () => {
    expect(createEmptyLeagueTableRow()).toEqual({
      team: { id: '', path: '' },
      position: '',
      played: 0,
      won: 0,
      lost: 0,
      drawn: 0,
      leaguePoints: 0,
      matchPointsFor: 0,
      matchPointsAgainst: 0,
    })
  })

  it('sets the row team path from the selected team', () => {
    const tableRow = row('')

    setLeagueTableRowTeam(tableRow, teams, 'bravo')

    expect(tableRow.team).toEqual({ id: 'bravo', path: 'team/bravo' })
  })

  it('normalises table id, path, and row team paths before save', () => {
    const table = {
      id: '',
      path: '',
      description: 'Main Table',
      rows: [{ ...row('alpha'), team: { id: 'alpha', path: '' } }],
    } as LeagueTable

    expect(leagueTableForSave(table, 'season/s1/competition/c1', 'new', true)).toMatchObject({
      id: 'main-table',
      path: 'season/s1/competition/c1/leaguetable/main-table',
      rows: [{ team: { id: 'alpha', path: 'team/alpha' } }],
    })
  })
})
