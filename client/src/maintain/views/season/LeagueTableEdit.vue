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
              <v-btn data-test="recalculate-positions-button" color="secondary" @click="recalculatePositions" :disabled="!leagueTable.rows.length">
                Recalculate Positions
              </v-btn>
              <v-btn data-test="add-row-button" color="primary" @click="addRow" :disabled="!unallocatedTeams.length">Add Row</v-btn>
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
                  <v-select data-test="league-table-team-select" :items="availableTeamsForRow(index)" item-title="name" item-value="id"
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
                  <v-btn icon color="error" size="small" @click="removeRow(index)">
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
          <v-btn data-test="save-league-table-button" color="primary" @click="save" :disabled="!valid">Save</v-btn>
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
import {
  availableTeamsForLeagueTableRow,
  createEmptyLeagueTableRow,
  leagueTableForSave,
  setLeagueTableRowTeam,
  unallocatedLeagueTableTeams,
} from './leagueTableEditHelpers'

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
const unallocatedTeams = computed(() => unallocatedLeagueTableTeams(teams.value, leagueTable.value))

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
  setLeagueTableRowTeam(row, teams.value, id)
}

const availableTeamsForRow = (rowIndex: number) => {
  return availableTeamsForLeagueTableRow(teams.value, leagueTable.value?.rows || [], rowIndex)
}

const addRow = () => {
  leagueTable.value?.rows.push(createEmptyLeagueTableRow())
}

const removeRow = (index: number) => {
  leagueTable.value?.rows.splice(index, 1)
}

const tableForSave = (table: LeagueTable): LeagueTable => {
  return leagueTableForSave(table, compPath.value, route.params.id as string, isNew.value)
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
