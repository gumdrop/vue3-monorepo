<template>
  <v-container v-if="leagueTable">
    <v-form ref="form" v-model="valid">
      <v-card>
        <v-card-title>
          {{ isNew ? 'Add' : 'Edit' }} League Table
        </v-card-title>
        <v-card-text>
          <v-text-field v-model="leagueTable.description" label="Description"></v-text-field>

          <v-row class="mb-3">
            <v-col cols="12" class="d-flex justify-end ga-2">
              <v-btn color="secondary" small @click="recalculatePositions" :disabled="!leagueTable.rows.length">
                Recalculate Positions
              </v-btn>
              <v-btn color="primary" small @click="addRow" :disabled="!unallocatedTeams.length">Add Row</v-btn>
            </v-col>
          </v-row>
          <v-table>
            <thead>
              <tr>
                <th>Team</th>
                <th>Position</th>
                <th>P</th>
                <th>W</th>
                <th>D</th>
                <th>L</th>
                <th>League Pts</th>
                <th>For</th>
                <th>Against</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, index) in leagueTable.rows" :key="row.team.id || index">
                <td>
                  <v-select :items="availableTeamsForRow(index)" item-title="name" item-value="id"
                    v-model="row.team.id" label="Team" dense hide-details
                    @update:model-value="setRowTeam(row, $event)" />
                </td>
                <td>
                  <v-text-field v-model="row.position" label="Position" dense hide-details />
                </td>
                <td>
                  <v-text-field v-model.number="row.played" type="number" dense hide-details />
                </td>
                <td>
                  <v-text-field v-model.number="row.won" type="number" dense hide-details />
                </td>
                <td>
                  <v-text-field v-model.number="row.drawn" type="number" dense hide-details />
                </td>
                <td>
                  <v-text-field v-model.number="row.lost" type="number" dense hide-details />
                </td>
                <td>
                  <v-text-field v-model.number="row.leaguePoints" type="number" dense hide-details />
                </td>
                <td>
                  <v-text-field v-model.number="row.matchPointsFor" type="number" dense hide-details />
                </td>
                <td>
                  <v-text-field v-model.number="row.matchPointsAgainst" type="number" dense hide-details />
                </td>
                <td>
                  <v-btn icon small color="error" @click="removeRow(index)">
                    <span class="mdi mdi-delete"></span>
                  </v-btn>
                </td>
              </tr>
            </tbody>
          </v-table>
          <p class="text-caption mt-2">Rows are usually managed automatically based on results.</p>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="secondary" @click="back">Cancel</v-btn>
          <v-btn color="primary" @click="save" :disabled="!valid">Save</v-btn>
        </v-card-actions>
      </v-card>
    </v-form>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import LeagueTableDAO from '@/dao/LeagueTableDAO'
import TeamDAO from '@/dao/TeamDAO'
import type LeagueTable from '@/entity/LeagueTable'
import type { LeagueTableRow } from '@/entity/LeagueTable'
import type Team from '@/entity/Team'
import { useValidations } from '@/site/components/Validation'
import { recalculateTables } from '@quizleague/shared'

const route = useRoute()
const router = useRouter()
const rules = useValidations()

const leagueTable = ref<LeagueTable | null>(null)
const teams = ref<Team[]>([])
const valid = ref(false)

const isNew = computed(() => route.params.id === 'new')
const seasonId = computed(() => route.params.seasonId as string)
const competitionId = computed(() => route.params.competitionId as string)
const compPath = computed(() => `season/${seasonId.value}/competition/${competitionId.value}`)
const allocatedTeamIds = computed(() => {
  const rows = leagueTable.value?.rows || []
  return new Set(rows.map((row) => row.team?.id).filter((id) => id))
})
const unallocatedTeams = computed(() => teams.value.filter((team) => !allocatedTeamIds.value.has(team.id)))

const createEmptyRow = (): LeagueTableRow => ({
  team: { id: '', path: '' },
  position: '',
  played: 0,
  won: 0,
  lost: 0,
  drawn: 0,
  leaguePoints: 0,
  matchPointsFor: 0,
  matchPointsAgainst: 0
})

onMounted(async () => {
  teams.value = (await TeamDAO.list()) || []
  if (isNew.value) {
    leagueTable.value = {
      id: '',
      path: `${compPath.value}/leaguetable`,
      description: '',
      rows: []
    } as LeagueTable
  } else {
    const id = route.params.id as string
    const path = `${compPath.value}/leaguetable/${id}`
    leagueTable.value = (await LeagueTableDAO.getDataByPath(path)) as LeagueTable | null
  }
})

const setRowTeam = (row: LeagueTableRow, id: string) => {
  const team = teams.value.find((t) => t.id === id)
  row.team = team ? { id: team.id, path: team.path } : { id, path: '' }
}

const availableTeamsForRow = (rowIndex: number) => {
  const rows = leagueTable.value?.rows || []
  const allocatedToOtherRows = new Set(
    rows
      .filter((_, index) => index !== rowIndex)
      .map((row) => row.team?.id)
      .filter((id) => id),
  )
  return teams.value.filter((team) => !allocatedToOtherRows.has(team.id))
}

const addRow = () => {
  leagueTable.value?.rows.push(createEmptyRow())
}

const removeRow = (index: number) => {
  leagueTable.value?.rows.splice(index, 1)
}

const slug = (value: string) => value.trim().toLowerCase().replace(/\s+/g, '-')

const tableId = (table: LeagueTable) => {
  const routeId = route.params.id as string
  return isNew.value ? slug(table.description || '') : table.id || routeId
}

const normaliseRow = (row: LeagueTableRow): LeagueTableRow => {
  const teamId = row.team?.id || ''
  return {
    ...row,
    team: {
      id: teamId,
      path: row.team?.path || (teamId ? `team/${teamId}` : ''),
    },
  }
}

const tableForSave = (table: LeagueTable): LeagueTable => {
  const id = tableId(table)
  return {
    ...table,
    id,
    path: `${compPath.value}/leaguetable/${id}`,
    rows: table.rows.map(normaliseRow),
  }
}

const recalculatePositions = () => {
  if (!leagueTable.value) return

  const [recalculated] = recalculateTables([tableForSave(leagueTable.value)], [])
  leagueTable.value.rows = recalculated.rows
}

const save = async () => {
  if (leagueTable.value) {
    await LeagueTableDAO.save(tableForSave(leagueTable.value))
    back()
  }
}

const back = () => {
  router.push(`/season/${seasonId.value}/competition/${competitionId.value}`)
}
</script>
