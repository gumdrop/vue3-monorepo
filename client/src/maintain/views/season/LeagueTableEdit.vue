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
            <v-col cols="12" class="d-flex justify-end">
              <v-btn color="primary" small @click="addRow">Add Row</v-btn>
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
                  <v-select :items="teams" item-title="name" item-value="id" v-model="row.team.id" label="Team" dense
                    hide-details @change="setRowTeam(row, $event)" />
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

const route = useRoute()
const router = useRouter()
const rules = useValidations()

const leagueTable = ref<LeagueTable | null>(null)
const teams = ref<Team[]>([])
const valid = ref(false)

const isNew = computed(() => route.params.id === 'new')
const seasonId = computed(() => route.params.seasonId as string)
const competitionId = computed(() => route.params.competitionId as string)

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
  const compPath = `season/${seasonId.value}/competition/${competitionId.value}`
  if (isNew.value) {
    leagueTable.value = {
      id: '',
      path: `${compPath}/leaguetable`,
      description: '',
      rows: []
    } as LeagueTable
  } else {
    const id = route.params.id as string
    const path = `${compPath}/leaguetable/${id}`
    leagueTable.value = (await LeagueTableDAO.getDataByPath(path)) as LeagueTable | null
  }
})

const setRowTeam = (row: LeagueTableRow, id: string) => {
  const team = teams.value.find((t) => t.id === id)
  row.team = team ? { id: team.id, path: team.path } : { id, path: '' }
}

const addRow = () => {
  leagueTable.value?.rows.push(createEmptyRow())
}

const removeRow = (index: number) => {
  leagueTable.value?.rows.splice(index, 1)
}

const save = async () => {
  if (leagueTable.value) {
    if (isNew.value) {
      const id = (leagueTable.value.description || '').toLowerCase().replace(/\s+/g, '-')
      const path = `season/${seasonId.value}/competition/${competitionId.value}/leaguetable/${id}`
      await LeagueTableDAO.save({ ...leagueTable.value, id, path })
    } else {
      await LeagueTableDAO.save(leagueTable.value)
    }
    back()
  }
}

const back = () => {
  router.push(`/season/${seasonId.value}/competition/${competitionId.value}`)
}
</script>
