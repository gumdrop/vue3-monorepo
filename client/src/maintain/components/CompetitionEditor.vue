<template>
  <div>
    <v-card class="mb-4">
      <v-card-title>Competitions (season)</v-card-title>
      <v-card-text>
        <div v-if="!seasonPath">Select a season to edit its competitions</div>
        <div v-else>
          <v-row>
            <v-col>
              <v-text-field v-model="newName" label="Create new competition (name)" />
            </v-col>
            <v-col cols="auto" class="d-flex align-center">
              <v-btn color="primary" @click="createQuick">Create</v-btn>
            </v-col>
          </v-row>

          <v-list>
            <v-list-item v-for="comp in comps" :key="comp.path">
              <v-list-item-content>
                <v-list-item-title>{{ comp.name || comp.path }}</v-list-item-title>
                <v-list-item-subtitle v-if="comp.retired">(retired)</v-list-item-subtitle>
              </v-list-item-content>
              <v-list-item-action>
                <v-btn text small @click="edit(comp)">Edit</v-btn>
              </v-list-item-action>
            </v-list-item>
          </v-list>
        </div>
      </v-card-text>
    </v-card>

    <v-dialog v-model="dialog" width="750">
      <v-card>
        <v-card-title>Edit Competition</v-card-title>
        <v-card-text style="max-height: 70vh; overflow-y: auto;">
          <v-form ref="form">
            <v-text-field v-model="editing._name" label="Type (_name)" />
            <v-text-field v-model.number="editing.duration" label="Duration" type="number" />
            <v-text-field v-model="editing.icon" label="Icon" />
            <v-text-field v-model="editing.startTime" label="Start Time" />
            <PathField v-model="editing.text" label="Text Path" @choose="$emit('choose-text', editing)" />
            <v-checkbox v-model="editing.retired" label="Retired" />

            <v-divider class="my-4" />
            <FixturesEditor v-if="editing?.path" :competitionPath="editing.path" @created="onFixturesChange" @saved="onFixturesChange" />
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn text @click="dialog = false">Cancel</v-btn>
          <v-btn color="primary" @click="save">Save</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue'
import CompetitionDAO from '@/dao/CompetitionDAO'
import { useKey } from '@/services/KeyService'
import PathField from './PathField.vue'
import FixturesEditor from './FixturesEditor.vue'

const props = defineProps({
  seasonPath: { type: String, required: false }
})

const emits = defineEmits(['created','saved'])

const comps = ref<any[]>([])
const dialog = ref(false)
const editing = ref<any>({})
const newName = ref('')
const { encode: encodeKey } = useKey()

const load = async () => {
  if (!props.seasonPath) {
    comps.value = []
    return
  }
  try {
    const col = CompetitionDAO.subCollection(`${props.seasonPath}`)
    comps.value = await CompetitionDAO.entities(col)
  } catch (e) {
    comps.value = []
  }
}

const createQuick = async () => {
  if (!props.seasonPath) return
  const name = (newName.value || 'New').trim()
  const encoded = encodeKey(name) || `${Date.now()}`
  const path = `${props.seasonPath}/competition/${encoded}`
  const entity: any = { name, path }
  try {
    await CompetitionDAO.save(entity)
    newName.value = ''
    await load()
    emits('created', entity)
  } catch (e) {
    // ignore here; App.vue handles global snackbars
  }
}

const edit = (c: any) => {
  editing.value = JSON.parse(JSON.stringify(c))
  dialog.value = true
}

const onFixturesChange = () => {
  // fixtures were created/saved, optionally refresh or just keep dialog open
  // no action needed here; fixtures editor handles its own state
}

const save = async () => {
  try {
    await CompetitionDAO.save(editing.value)
    dialog.value = false
    await load()
    emits('saved', editing.value)
  } catch (e) {
    // noop
  }
}

watch(() => props.seasonPath, load, { immediate: true })
</script>

<style scoped></style>
