<template>
  <v-container v-if="fixtures">
    <v-form ref="form" v-model="valid">
      <v-card>
        <v-card-title>
          {{ isNew ? 'Add' : 'Edit' }} Fixture Group
        </v-card-title>
        <v-card-text>
          <v-text-field v-model="fixtures.description" label="Description"
            :rules="[rules.required('Description')]"></v-text-field>
          <v-text-field v-model="fixtures.date" label="Date" type="date"
            :rules="[rules.required('Date')]"></v-text-field>
          <v-text-field v-model="fixtures.start" label="Start Time" placeholder="20:00"></v-text-field>
          <v-text-field v-model="fixtures.questionsUrl" label="Questions URL"></v-text-field>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="secondary" @click="back">Cancel</v-btn>
          <v-btn color="primary" @click="save" :disabled="!valid">Save</v-btn>
        </v-card-actions>
      </v-card>
    </v-form>

    <v-card class="mt-4" v-if="!isNew">
      <v-card-title>
        Fixtures
        <v-spacer></v-spacer>
        <v-btn color="primary" @click="addFixture" :disabled="unallocatedTeams.length < 2">Add Fixture</v-btn>
      </v-card-title>
      <v-list>
        <v-list-item v-for="fix in fixtureList" :key="fix.id" @click="editFixture(fix)">
          <v-list-item-title>
            {{ nameFor(fix.home?.id) }} vs {{ nameFor(fix.away?.id) }}
          </v-list-item-title>
          <template v-slot:append>
            <v-btn icon="mdi-delete" variant="text" color="error" @click.stop="removeFixture(fix)"></v-btn>
          </template>
        </v-list-item>
      </v-list>
    </v-card>

    <v-dialog v-model="showFixtureDialog" persistent max-width="600">
      <v-card>
        <v-card-title>{{ fixtureToEdit && fixtureToEdit.id ? 'Edit' : 'Add' }} Fixture</v-card-title>
        <v-card-text>
          <v-select v-model="fixtureToEdit.homePath" :items="availableTeamsForFixture('home')" item-title="name" item-value="path"
            label="Home Team" @update:model-value="setHomeTeam"></v-select>
          <v-select v-model="fixtureToEdit.awayPath" :items="availableTeamsForFixture('away')" item-title="name" item-value="path"
            label="Away Team"></v-select>
          <v-select v-model="fixtureToEdit.venuePath" :items="venues" item-title="name" item-value="path"
            label="Venue"></v-select>

          <template v-if="fixtureToEdit && fixtureToEdit.id && fixtureToEdit.result">
            <v-divider class="my-2"></v-divider>
            <v-row>
              <v-col cols="6">
                <v-text-field type="number" v-model.number="fixtureToEdit.result.homeScore"
                  label="Home Score"></v-text-field>
              </v-col>
              <v-col cols="6">
                <v-text-field type="number" v-model.number="fixtureToEdit.result.awayScore"
                  label="Away Score"></v-text-field>
              </v-col>
            </v-row>
            <v-text-field v-model="fixtureToEdit.result.note" label="Result Note"></v-text-field>
          </template>
          <template v-else-if="fixtureToEdit && fixtureToEdit.id && !fixtureToEdit.result">
            <v-row>
              <v-col>
                <v-btn color="primary" @click="createResult">Create Result</v-btn>
              </v-col>
            </v-row>
          </template>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="secondary" @click="showFixtureDialog = false">Cancel</v-btn>
          <v-btn color="primary" @click="saveFixture" :disabled="!canSaveFixture">Save</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import FixturesDAO from '@/dao/FixturesDAO'
import { fixtureDAO } from '@/dao/FixturesDAO'
import TeamDAO from '@/dao/TeamDAO'
import VenueDAO from '@/dao/VenueDAO'
import type Team from '@/entity/Team'
import type Fixtures from '@/entity/Fixtures'
import type { Fixture } from '@/entity/Fixtures'
import type Venue from '@/entity/Venue'
import { useValidations } from '@/site/components/Validation'

const route = useRoute()
const router = useRouter()
const rules = useValidations()

const fixtures = ref<Fixtures | null>(null)
const fixtureList = ref<Fixture[]>([])
const teams = ref<Team[]>([])
const venues = ref<Venue[]>([])
const valid = ref(false)

const isNew = computed(() => route.params.id === 'new')
const seasonId = computed(() => route.params.seasonId as string)
const competitionId = computed(() => route.params.competitionId as string)
const allocatedTeamPaths = computed(() => {
  return new Set(
    fixtureList.value
      .flatMap((fixture) => [fixture.home?.path, fixture.away?.path])
      .filter((path) => path),
  )
})
const unallocatedTeams = computed(() => teams.value.filter((team) => !allocatedTeamPaths.value.has(team.path)))

onMounted(async () => {
  const compPath = `season/${seasonId.value}/competition/${competitionId.value}`
  if (isNew.value) {
    fixtures.value = {
      id: '',
      path: `${compPath}/fixtures`,
      description: '',
      date: '',
      start: '20:00',
      questionsUrl: '',
    } as Fixtures
  } else {
    const id = route.params.id as string
    const path = `${compPath}/fixtures/${id}`
    fixtures.value = (await FixturesDAO.getDataByPath(path)) || null
    if (fixtures.value) {
      fixtureList.value = await fixtureDAO.entities(fixtureDAO.subCollection(path))
      teams.value = (await TeamDAO.list()) || []
      venues.value = (await VenueDAO.list()) || []
    }
  }
  // load teams/venues when creating new as well
  if (isNew.value) {
    teams.value = (await TeamDAO.list()) || []
    venues.value = (await VenueDAO.list()) || []
  }
})

const nameFor = (id?: string) => {
  if (!id) return ''
  const t = teams.value.find((x) => x.id === id)
  return t ? t.name : id
}

const showFixtureDialog = ref(false)
type FixtureEdit = Partial<Fixture> & { homePath?: string; awayPath?: string; venuePath?: string }
const fixtureToEdit = ref<FixtureEdit>({} as FixtureEdit)
const canSaveFixture = computed(() => {
  return Boolean(
    fixtureToEdit.value.homePath &&
    fixtureToEdit.value.awayPath &&
    fixtureToEdit.value.homePath !== fixtureToEdit.value.awayPath
  )
})

const allocatedTeamPathsForOtherFixtures = () => {
  const fixtureId = fixtureToEdit.value.id
  return new Set(
    fixtureList.value
      .filter((fixture) => fixture.id !== fixtureId)
      .flatMap((fixture) => [fixture.home?.path, fixture.away?.path])
      .filter((path) => path),
  )
}

const availableTeamsForFixture = (slot: 'home' | 'away') => {
  const selectedPath = slot === 'home' ? fixtureToEdit.value.homePath : fixtureToEdit.value.awayPath
  const otherSelectedPath = slot === 'home' ? fixtureToEdit.value.awayPath : fixtureToEdit.value.homePath
  const allocatedToOtherFixtures = allocatedTeamPathsForOtherFixtures()

  return teams.value.filter((team) => {
    if (team.path === selectedPath) return true
    if (team.path === otherSelectedPath) return false
    return !allocatedToOtherFixtures.has(team.path)
  })
}

const setHomeTeam = (homePath: string | null) => {
  fixtureToEdit.value.homePath = homePath || ''
  const team = teams.value.find((t) => t.path === fixtureToEdit.value.homePath)
  fixtureToEdit.value.venuePath = team?.venue?.path || ''
}

const editFixture = (fix: Fixture) => {
  fixtureToEdit.value = { ...fix, homePath: fix.home?.path, awayPath: fix.away?.path, venuePath: fix.venue?.path } as FixtureEdit
  showFixtureDialog.value = true
}

const createResult = async () => {
  if (!fixtureToEdit.value) return
  if (!fixtureToEdit.value.id) return
  fixtureToEdit.value.result = { homeScore: 0, awayScore: 0, note: '' }
  const toSave = fixtureToEdit.value as unknown as Fixture
  await fixtureDAO.save(toSave)
  const idx = fixtureList.value.findIndex((f) => f.id === toSave.id)
  if (idx >= 0) {
    fixtureList.value[idx] = { ...toSave }
  } else {
    fixtureList.value.push({ ...toSave })
  }
  // keep dialog open so user can edit the newly-created result
}

const addFixture = () => {
  if (!fixtures.value) return
  fixtureToEdit.value = {
    id: '',
    homePath: '',
    awayPath: '',
    venuePath: '',
    path: '',
  }
  showFixtureDialog.value = true
}

const saveFixture = async () => {
  if (!fixtureToEdit.value || !fixtures.value) return
  // ensure id
  if (!fixtureToEdit.value.id) {
    fixtureToEdit.value = { ...fixtureToEdit.value, id: `${Date.now()}` }
  }
  // convert selected paths to DocumentReferences
  if (fixtureToEdit.value.homePath) {
    fixtureToEdit.value.home = TeamDAO.getByPath(fixtureToEdit.value.homePath)
  }
  if (fixtureToEdit.value.awayPath) {
    fixtureToEdit.value.away = TeamDAO.getByPath(fixtureToEdit.value.awayPath)
  }
  if (fixtureToEdit.value.venuePath) {
    fixtureToEdit.value.venue = VenueDAO.getByPath(fixtureToEdit.value.venuePath)
  }
  // ensure path
  if (!fixtureToEdit.value.path) {
    fixtureToEdit.value = { ...fixtureToEdit.value, path: `${fixtures.value.path}/fixture/${fixtureToEdit.value.id}` }
  }
  const toSave = fixtureToEdit.value as unknown as Fixture
  await fixtureDAO.save(toSave)
  // update local list
  const idx = fixtureList.value.findIndex((f) => f.id === toSave.id)
  if (idx >= 0) {
    fixtureList.value[idx] = { ...toSave }
  } else {
    fixtureList.value.push({ ...toSave })
  }
  showFixtureDialog.value = false
}

const save = async () => {
  if (fixtures.value) {
    if (isNew.value) {
      const id = fixtures.value.date
      fixtures.value = { ...fixtures.value, id, path: `season/${seasonId.value}/competition/${competitionId.value}/fixtures/${id}` } as Fixtures
    }
    await FixturesDAO.save(fixtures.value)
    back()
  }
}

const back = () => {
  router.push(`/season/${seasonId.value}/competition/${competitionId.value}`)
}

// duplicate addFixture removed; using dialog-based addFixture defined above

const removeFixture = async (fix: Fixture) => {
  if (confirm('Are you sure?')) {
    await fixtureDAO.remove(fix.path)
    fixtureList.value = fixtureList.value.filter(f => f.id !== fix.id)
  }
}
</script>
