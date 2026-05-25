<template>
  <v-container v-if="season">
    <v-form ref="form" v-model="valid">
      <v-card>
        <v-card-title> {{ isNew ? 'Add' : 'Edit' }} Season </v-card-title>
        <v-card-text>
          <v-text-field
            v-model.number="season.startYear"
            label="Start Year"
            type="number"
            :rules="[rules.required('Start Year')]"
          ></v-text-field>
          <v-text-field
            v-model.number="season.endYear"
            label="End Year"
            type="number"
            :rules="[rules.required('End Year')]"
          ></v-text-field>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="secondary" to="/season">Cancel</v-btn>
          <v-btn color="primary" @click="save" :disabled="!valid">Save</v-btn>
        </v-card-actions>
      </v-card>
    </v-form>

    <v-card class="mt-4" v-if="!isNew">
      <v-card-title>
        Text
        <v-spacer></v-spacer>
        <v-btn v-if="!season.text" color="primary" @click="addText">Add Text</v-btn>
      </v-card-title>
      <v-card-text>
        <TextEdit v-model="text" @save="saveText" />
      </v-card-text>
    </v-card>

    <v-card class="mt-4" v-if="!isNew">
      <v-card-title>
        Competitions
        <v-spacer></v-spacer>
        <v-btn color="primary" @click="addCompetition">Add Competition</v-btn>
      </v-card-title>
      <v-list>
        <v-list-item v-for="comp in competitions" :key="comp.id" @click="editCompetition(comp)">
          <v-list-item-title>{{ comp.name }} ({{ comp._name }})</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-card>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import SeasonDAO from '@/dao/SeasonDAO'
import CompetitionDAO from '@/dao/CompetitionDAO'
import TextDAO from '@/dao/TextDAO'
import type Season from '@/entity/Season'
import type Competition from '@/entity/Competition'
import type Text from '@/entity/Text'
import { newEntityIdentity } from '@/maintain/utils/entityIds'
import { useValidations } from '@/site/components/Validation'
import TextEdit from '@/site/components/text/TextEdit.vue'

const route = useRoute()
const router = useRouter()
const rules = useValidations()

const season = ref<any | null>(null)
const competitions = ref<Competition[]>([])
const text = ref<Text | undefined>()
const valid = ref(false)
const form = ref<any>(null)

const isNew = computed(() => route.params.id === 'new')

onMounted(async () => {
  if (isNew.value) {
    season.value = {
      id: '',
      path: 'season',
      startYear: new Date().getFullYear(),
      endYear: new Date().getFullYear() + 1,
      calendar: [],
      text: undefined,
    } as Season
  } else {
    const id = route.params.id as string
    season.value = await SeasonDAO.getDataById(id)
    if (season.value) {
      // Load competitions
      const seasonRef = SeasonDAO.getById(id)
      competitions.value = await CompetitionDAO.entities(CompetitionDAO.nestedCollection(seasonRef))
      // load linked text if present
      if (season.value.text) {
        text.value = await TextDAO.getDataByPath(season.value.text)
      }
    }
  }
})

const save = async () => {
  if (season.value) {
    // save text first if being edited
    if (text.value) {
      await TextDAO.save(text.value)
    }

    if (season.value.text && typeof season.value.text === 'object') {
      const id = (season.value.text as { id: string }).id
      const path = (season.value.text as { path: string }).path
      const cleaned = path.replace(/\/$/, '')
      season.value.text = {
        id,
        path: cleaned.endsWith(`/${id}`)
          ? cleaned.substring(0, cleaned.lastIndexOf(`/${id}`))
          : cleaned,
      }
    }

    if (isNew.value) {
      Object.assign(season.value, newEntityIdentity('season'))
    }
    await SeasonDAO.save(season.value)
    router.push('/season')
  }
}

const addCompetition = () => {
  router.push(`/season/${season.value?.id}/competition/new`)
}

const editCompetition = (comp: Competition) => {
  router.push(`/season/${season.value?.id}/competition/${comp.id}`)
}

const saveText = async (textEntity: Text) => {
  await TextDAO.save(textEntity)
  text.value = textEntity
}

const addText = async () => {
  if (!season.value) return

  const textReference = newEntityIdentity('text')
  const textEntity = { ...textReference, text: '', mimeType: 'text/html' } as Text
  await TextDAO.save(textEntity)
  season.value.text = textReference
  await SeasonDAO.save(season.value)
  text.value = textEntity
}
</script>

<script lang="ts">
export default {
  components: { TextEdit },
}
</script>
