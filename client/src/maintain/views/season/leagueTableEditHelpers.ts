import type LeagueTable from '@/entity/LeagueTable'
import type { LeagueTableRow } from '@/entity/LeagueTable'
import type Team from '@/entity/Team'
import { newEntityId } from '@/maintain/utils/entityIds'

export const allocatedLeagueTableTeamIds = (rows: LeagueTableRow[]) => {
  return new Set(rows.map((row) => row.team?.id).filter(Boolean))
}

export const unallocatedLeagueTableTeams = (teams: Team[], table: LeagueTable | null) => {
  const allocatedIds = allocatedLeagueTableTeamIds(table?.rows || [])
  return teams.filter((team) => !allocatedIds.has(team.id))
}

export const createEmptyLeagueTableRow = (): LeagueTableRow => ({
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

export const setLeagueTableRowTeam = (row: LeagueTableRow, teams: Team[], id: string) => {
  const team = teams.find((t) => t.id === id)
  row.team = team ? { id: team.id, path: team.path } : { id, path: '' }
}

export const availableTeamsForLeagueTableRow = (
  teams: Team[],
  rows: LeagueTableRow[],
  rowIndex: number,
) => {
  const allocatedToOtherRows = new Set(
    rows
      .filter((_, index) => index !== rowIndex)
      .map((row) => row.team?.id)
      .filter(Boolean),
  )
  return teams.filter((team) => !allocatedToOtherRows.has(team.id))
}

export const leagueTableId = (
  table: LeagueTable,
  routeId: string,
  isNew: boolean,
  createId = newEntityId,
) => {
  return isNew ? table.id || createId() : table.id || routeId
}

export const normaliseLeagueTableRow = (row: LeagueTableRow): LeagueTableRow => {
  const teamId = row.team?.id || ''
  return {
    ...row,
    team: {
      id: teamId,
      path: row.team?.path || (teamId ? `team/${teamId}` : ''),
    },
  }
}

export const leagueTableForSave = (
  table: LeagueTable,
  compPath: string,
  routeId: string,
  isNew: boolean,
  createId = newEntityId,
): LeagueTable => {
  const id = leagueTableId(table, routeId, isNew, createId)
  return {
    ...table,
    id,
    path: `${compPath}/leaguetable/${id}`,
    rows: table.rows.map(normaliseLeagueTableRow),
  }
}
