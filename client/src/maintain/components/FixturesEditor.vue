<template>
  <div>
    <div v-if="!competitionPath" class="text-caption">Select a competition to edit its fixtures</div>
    <div v-else>
      <div class="text-subtitle-2 mb-2">Fixtures</div>
      <v-row class="mb-3">
        <v-col>
          <v-text-field v-model="newFixtureName" label="Create new fixture (name)" density="compact" />
        </v-col>
        <v-col cols="auto" class="d-flex align-center">
          <v-btn size="small" color="primary" @click="createQuick">Create</v-btn>
        </v-col>
        <v-col cols="12" class="mt-2">
          <v-btn size="small" text @click="createMode = !createMode">{{ createMode ? 'Cancel detailed create' : 'Create with details' }}</v-btn>
        </v-col>
      </v-row>

      <v-expand-transition>
        <div v-if="createMode" class="mb-4">
          <v-form ref="createForm">
            <v-row>
              <v-col cols="4"><v-text-field v-model="createData.description" label="Description" density="compact" /></v-col>
              <v-col cols="3"><v-text-field v-model="createData.date" label="Date" type="date" density="compact" /></v-col>
              <v-col cols="3"><v-text-field v-model="createData.start" label="Start" density="compact" /></v-col>
              <v-col cols="2" class="d-flex align-center"><v-btn small color="primary" @click="createDetailed">Create fixture</v-btn></v-col>
            </v-row>
          </v-form>
        </div>
      </v-expand-transition>

      <v-expansion-panels v-model="expandedFixture">
        <v-expansion-panel v-for="(fixture, idx) in fixtures" :key="fixture.key">
          <v-expansion-panel-title>
            <div class="d-flex align-center" style="width:100%">
              <div class="flex-grow-1">{{ fixture.description || fixture.key }}</div>
              <div class="text-caption mr-2">{{ fixture.date }} {{ fixture.start }}</div>
              <v-btn icon small @click.stop="duplicateFixture(idx)"><v-icon>mdi-content-copy</v-icon></v-btn>
              <v-btn icon small @click.stop="retireFixture(idx)"><v-icon>mdi-delete</v-icon></v-btn>
            </div>
          </v-expansion-panel-title>
          <v-expansion-panel-text>
            <v-form>
              <v-text-field v-model="fixture.description" label="Description" density="compact" />
              <v-text-field v-model="fixture.date" label="Date" type="date" density="compact" />
              <v-text-field v-model="fixture.start" label="Start Time" density="compact" />
              <v-text-field v-model="fixture.questionsUrl" label="Questions URL" density="compact" />
            </v-form>
            <v-row class="mt-3">
              <v-spacer />
              <v-btn size="small" text @click="resetFixture(idx)">Cancel</v-btn>
              <v-btn size="small" color="primary" @click="saveFixture(fixture)">Save</v-btn>
            </v-row>
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue'
import FixturesDAO from '@/dao/FixturesDAO'
import { useKey } from '@/services/KeyService'

const props = defineProps({
  competitionPath: { type: String, required: false }
})

const emits = defineEmits(['created', 'saved'])

const fixtures = ref<any[]>([])
const fixtureBackups = ref<Map<string, any>>(new Map())
const expandedFixture = ref<number | undefined>(undefined)
const newFixtureName = ref('')
const createMode = ref(false)
const createData = ref<any>({ description: '', date: '', start: '' })
const { encode: encodeKey } = useKey()

const load = async () => {
  if (!props.competitionPath) {
    fixtures.value = []
    return
  }
  try {
    const col = FixturesDAO.subCollection(`${props.competitionPath}`)
    fixtures.value = await FixturesDAO.entities(col)
    fixtureBackups.value.clear()
  } catch (e) {
    fixtures.value = []
  }
}

const createQuick = async () => {
  if (!props.competitionPath) return
  const name = (newFixtureName.value || 'New').trim()
  const encoded = encodeKey(name) || `${Date.now()}`
  const key = `fixtures_${encoded}`
  const path = `${props.competitionPath}/fixture/${encoded}`
  const entity: any = { description: name, date: '', start: '', key, path }
  try {
    await FixturesDAO.save(entity)
    newFixtureName.value = ''
    await load()
    emits('created', entity)
  } catch (e) {
    // ignore here
  }
}

const createDetailed = async () => {
  if (!props.competitionPath) return
  const name = (createData.value.description || 'New').trim()
  const encoded = encodeKey(name) || `${Date.now()}`
  const path = `${props.competitionPath}/fixture/${encoded}`
  const entity: any = { ...createData.value, key: `fixtures_${encoded}`, path }
  try {
    await FixturesDAO.save(entity)
    createMode.value = false
    createData.value = { description: '', date: '', start: '' }
    await load()
    emits('created', entity)
  } catch (e) {
    // noop
  }
}

const resetFixture = (idx: number) => {
  const fixture = fixtures.value[idx]
  if (fixture && fixtureBackups.value.has(fixture.key)) {
    const backup = fixtureBackups.value.get(fixture.key)
    Object.assign(fixture, backup)
    fixtureBackups.value.delete(fixture.key)
  }
  expandedFixture.value = undefined
}

const saveFixture = async (f: any) => {
  try {
    await FixturesDAO.save(f)
    fixtureBackups.value.delete(f.key)
    emits('saved', f)
    expandedFixture.value = undefined
  } catch (e) {
    // noop
  }
}

const retireFixture = async (idx: number) => {
  const f = fixtures.value[idx]
  if (!f) return
  try {
    f.retired = true
    await FixturesDAO.save(f)
    await load()
    emits('saved', f)
  } catch (e) {
    // noop
  }
}

const duplicateFixture = async (idx: number) => {
  const f = fixtures.value[idx]
  if (!f || !props.competitionPath) return
  try {
    const name = (f.description || 'Copy').trim()
    const encoded = encodeKey(name + Date.now()) || `${Date.now()}`
    const path = `${props.competitionPath}/fixture/${encoded}`
    const copy: any = { ...JSON.parse(JSON.stringify(f)), key: `fixtures_${encoded}`, path }
    // remove id if present
    copy.id = undefined
    await FixturesDAO.save(copy)
    await load()
    emits('created', copy)
  } catch (e) {
    // noop
  }
}

watch(() => props.competitionPath, () => {
  load()
  // When expansion panel opens, save a backup of the fixture
}, { immediate: true })

watch(expandedFixture, (newIdx) => {
  if (newIdx !== undefined && newIdx >= 0 && newIdx < fixtures.value.length) {
    const fixture = fixtures.value[newIdx]
    if (!fixtureBackups.value.has(fixture.key)) {
      fixtureBackups.value.set(fixture.key, JSON.parse(JSON.stringify(fixture)))
    }
  }
})
</script>

<style scoped></style>
