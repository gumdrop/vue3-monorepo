<template>
  <v-container v-if="fixtures">
    <v-form ref="form" v-model="valid">
      <v-card>
        <v-card-title>
          {{ isNew ? 'Add' : 'Edit' }} Fixture Group
        </v-card-title>
        <v-card-text>
          <v-text-field v-model="fixtures.description" label="Description" :rules="[rules.required('Description')]"></v-text-field>
          <v-text-field v-model="fixtures.date" label="Date" type="date" :rules="[rules.required('Date')]"></v-text-field>
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
        <v-btn color="primary" @click="addFixture">Add Fixture</v-btn>
      </v-card-title>
      <v-list>
        <v-list-item v-for="fix in fixtureList" :key="fix.id">
          <v-list-item-title>
            {{ nameFor(fix.home.id) }} vs {{ nameFor(fix.away.id) }}
          </v-list-item-title>
          <template v-slot:append>
             <v-btn icon="mdi-delete" variant="text" color="error" @click="removeFixture(fix)"></v-btn>
          </template>
        </v-list-item>
      </v-list>
    </v-card>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import FixturesDAO from '@/dao/FixturesDAO'
import { fixtureDAO } from '@/dao/FixturesDAO'
import TeamDAO from '@/dao/TeamDAO'
import type Team from '@/entity/Team'
import type Fixtures from '@/entity/Fixtures'
import type { Fixture } from '@/entity/Fixtures'
import { useValidations } from '@/site/components/Validation'

const route = useRoute()
const router = useRouter()
const rules = useValidations()

const fixtures = ref<Fixtures | null>(null)
const fixtureList = ref<Fixture[]>([])
const teams = ref<Team[]>([])
const valid = ref(false)

const isNew = computed(() => route.params.id === 'new')
const seasonId = computed(() => route.params.seasonId as string)
const competitionId = computed(() => route.params.competitionId as string)

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
    fixtures.value = await FixturesDAO.getDataByPath(path)
    if (fixtures.value) {
        fixtureList.value = await fixtureDAO.entities(fixtureDAO.subCollection(path))
        teams.value = (await TeamDAO.list()) || []
    }
  }
})

const nameFor = (id?: string) => {
  if (!id) return ''
  const t = teams.value.find((x) => x.id === id)
  return t ? t.name : id
}

const save = async () => {
  if (fixtures.value) {
    if (isNew.value) {
        fixtures.value.id = fixtures.value.date
        fixtures.value.path = `season/${seasonId.value}/competition/${competitionId.value}/fixtures/${fixtures.value.id}`
    }
    await FixturesDAO.save(fixtures.value)
    back()
  }
}

const back = () => {
    router.push(`/season/${seasonId.value}/competition/${competitionId.value}`)
}

const addFixture = () => {
    // For simplicity, maybe a dialog here?
    console.log('Add fixture')
}

const removeFixture = async (fix: Fixture) => {
    if (confirm('Are you sure?')) {
        await fixtureDAO.remove(fix.path)
        fixtureList.value = fixtureList.value.filter(f => f.id !== fix.id)
    }
}
</script>
