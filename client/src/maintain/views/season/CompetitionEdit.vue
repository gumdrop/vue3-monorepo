<template>
  <v-container v-if="competition">
    <v-form ref="form" v-model="valid">
      <v-card>
        <v-card-title> {{ isNew ? 'Add' : 'Edit' }} Competition </v-card-title>
        <v-card-text>
          <v-text-field
            v-model="competition.name"
            label="Name"
            :rules="[rules.required('Name')]"
          ></v-text-field>
          <v-text-field v-model="competition.textName" label="Text Name"></v-text-field>
          <v-text-field
            v-model="competition.icon"
            label="Icon"
            :append-inner-icon="competition.icon || undefined"
          ></v-text-field>
          <v-select
            v-model="competition._name"
            :items="['league', 'cup', 'subsidiary', 'singleton']"
            label="Type"
            :rules="[rules.required('Type')]"
            :disabled="!isNew"
          ></v-select>
          <v-text-field
            v-model.number="competition.duration"
            label="Duration"
            type="number"
          ></v-text-field>

          <template
            v-if="
              competition._name === 'league' ||
              competition._name === 'cup' ||
              competition._name === 'singleton'
            "
          >
            <v-text-field
              v-model="competition.startTime"
              label="Start Time"
              placeholder="20:00"
            ></v-text-field>
          </template>

          <template v-if="competition._name === 'singleton'">
            <v-text-field
              v-model="competition.event.date"
              label="Date"
              type="date"
            ></v-text-field>
            <EntitySelect v-model="competition.event.venue" :dao="VenueDAO" label="Venue" />
          </template>

          <template v-if="competition._name === 'league'">
            <v-row>
              <v-col
                ><v-text-field
                  v-model.number="competition.win"
                  label="Win Points"
                  type="number"
                ></v-text-field
              ></v-col>
              <v-col
                ><v-text-field
                  v-model.number="competition.draw"
                  label="Draw Points"
                  type="number"
                ></v-text-field
              ></v-col>
              <v-col
                ><v-text-field
                  v-model.number="competition.loss"
                  label="Loss Points"
                  type="number"
                ></v-text-field
              ></v-col>
            </v-row>
          </template>
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
        Text
        <v-spacer></v-spacer>
        <v-btn v-if="!hasTextReference" color="primary" @click="addText">Add Text</v-btn>
      </v-card-title>
      <v-card-text>
        <TextEdit v-model="text" @save="saveText" />
      </v-card-text>
    </v-card>

    <v-card class="mt-4" v-if="!isNew && isTeamCompetition">
      <v-card-title>AI Roundup</v-card-title>
      <v-card-text>
        <v-alert v-if="roundupSuccessMessage" type="success" class="mb-4">
          {{ roundupSuccessMessage }}
        </v-alert>
        <v-alert v-if="roundupErrorMessage" type="error" class="mb-4">
          {{ roundupErrorMessage }}
        </v-alert>
        <div v-if="hasRoundup" data-test="competition-roundup-text">
          <TextEdit v-model="roundupText" @save="saveRoundupText" />
        </div>
        <div v-else class="text-body-2 text-medium-emphasis">
          No AI roundup has been generated for this competition yet.
        </div>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn
          data-test="regenerate-roundup-button"
          color="primary"
          :loading="regeneratingRoundup"
          :disabled="regeneratingRoundup"
          @click="regenerateRoundup"
        >
          Regenerate AI Roundup
        </v-btn>
      </v-card-actions>
    </v-card>

    <v-card
      class="mt-4"
      v-if="!isNew && (competition._name === 'league' || leagueTables.length > 0)"
    >
      <v-card-title>
        League Tables
        <v-spacer></v-spacer>
        <v-btn color="primary" @click="addLeagueTable">Add Table</v-btn>
      </v-card-title>
      <v-list>
        <template v-if="leagueTables.length">
          <v-list-item
            v-for="table in leagueTables"
            :key="table.id"
            @click="editLeagueTable(table)"
          >
            <v-list-item-title>{{ table.description || table.id }}</v-list-item-title>
          </v-list-item>
        </template>
        <template v-else>
          <v-list-item>
            <v-list-item-title>No league tables yet</v-list-item-title>
          </v-list-item>
        </template>
      </v-list>
    </v-card>

    <v-card class="mt-4" v-if="!isNew">
      <v-card-title>
        Fixtures
        <v-spacer></v-spacer>
        <v-btn color="primary" @click="addFixtures">Add Fixtures</v-btn>
      </v-card-title>
      <v-list>
        <v-list-item v-for="fixs in fixtures" :key="fixs.id" @click="editFixtures(fixs)">
          <v-list-item-title>{{ fixs.description }} - {{ fixs.date }}</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-card>
  </v-container>
</template>

<script setup lang="ts">
import axios from 'axios'
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import CompetitionDAO from '@/dao/CompetitionDAO'
import FixturesDAO from '@/dao/FixturesDAO'
import LeagueTableDAO from '@/dao/LeagueTableDAO'
import TextDAO from '@/dao/TextDAO'
import VenueDAO from '@/dao/VenueDAO'
import type Competition from '@/entity/Competition'
import type Fixtures from '@/entity/Fixtures'
import type LeagueTable from '@/entity/LeagueTable'
import type Text from '@/entity/Text'
import { newEntityIdentity } from '@/maintain/utils/entityIds'
import { useValidations } from '@/site/components/Validation'
import TextEdit from '@/site/components/text/TextEdit.vue'
import EntitySelect from '../../components/EntitySelect.vue'

const route = useRoute()
const router = useRouter()
const rules = useValidations()

const competition = ref<any | null>(null)
const fixtures = ref<Fixtures[]>([])
const leagueTables = ref<LeagueTable[]>([])
const text = ref<Text | undefined>()
const roundupText = ref<Text | undefined>()
const valid = ref(false)
const regeneratingRoundup = ref(false)
const roundupSuccessMessage = ref('')
const roundupErrorMessage = ref('')

const isNew = computed(() => route.params.id === 'new')
const seasonId = computed(() => route.params.seasonId as string)
const hasTextReference = computed(() => {
  return Boolean(competition.value?.text?.id && competition.value?.text?.path)
})
const isTeamCompetition = computed(() =>
  ['league', 'cup', 'subsidiary'].includes(competition.value?._name),
)
const hasRoundup = computed(() => roundupText.value !== undefined)

const ensureSingletonEvent = () => {
  if (!competition.value) return
  if (competition.value._name === 'singleton') {
    if (!competition.value.event) {
      competition.value.event = {
        date: '',
        time: competition.value.startTime || '20:00',
        duration: competition.value.duration || 1,
        venue: undefined,
      }
    }
  }
}

onMounted(async () => {
  if (isNew.value) {
    competition.value = {
      id: '',
      path: `season/${seasonId.value}/competition`,
      name: '',
      _name: 'league',
      duration: 1,
      textName: '',
      icon: '',
      text: { id: '', path: '' },
    }
  } else {
    const id = route.params.id as string
    const compPath = `season/${seasonId.value}/competition/${id}`
    competition.value = await CompetitionDAO.getDataByPath(compPath)
    if (competition.value) {
      fixtures.value = await FixturesDAO.entities(FixturesDAO.subCollection(compPath))
      fixtures.value.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      leagueTables.value = await LeagueTableDAO.entities(LeagueTableDAO.subCollection(compPath))
      if (hasTextReference.value) {
        text.value = await TextDAO.getData(competition.value.text)
      }
      await loadRoundupText()
    }
  }
  ensureSingletonEvent()
})

watch(
  () => competition.value?._name,
  () => {
    ensureSingletonEvent()
  },
)

watch(
  roundupText,
  (value) => {
    if (!competition.value || !value) return
    competition.value.roundup = TextDAO.getByPath(value)
  },
  { deep: true },
)

const save = async () => {
  if (competition.value) {
    if (competition.value._name === 'singleton') {
      ensureSingletonEvent()
      if (competition.value.event) {
        competition.value.event.time = competition.value.startTime || ''
        competition.value.event.duration = competition.value.duration || 1
        if (!competition.value.event.venue || !competition.value.event.venue.id) {
          delete competition.value.event.venue
        }
      }
    } else {
      delete competition.value.event
    }
    if (text.value) {
      await TextDAO.save(text.value)
    }
    if (roundupText.value) {
      await TextDAO.save(roundupText.value)
      competition.value.roundup = TextDAO.getByPath(roundupText.value)
    }
    if (isNew.value) {
      Object.assign(competition.value, newEntityIdentity(`season/${seasonId.value}/competition`))
    }
    await CompetitionDAO.save(competition.value)
    back()
  }
}

const back = () => {
  router.push(`/season/${seasonId.value}`)
}

const addFixtures = () => {
  router.push(`/season/${seasonId.value}/competition/${competition.value.id}/fixtures/new`)
}

const editFixtures = (fixs: Fixtures) => {
  router.push(`/season/${seasonId.value}/competition/${competition.value.id}/fixtures/${fixs.id}`)
}

const addLeagueTable = () => {
  router.push(`/season/${seasonId.value}/competition/${competition.value.id}/leaguetable/new`)
}

const editLeagueTable = (table: LeagueTable) => {
  router.push(
    `/season/${seasonId.value}/competition/${competition.value.id}/leaguetable/${table.id}`,
  )
}

const saveText = async (textEntity: Text) => {
  await TextDAO.save(textEntity)
  text.value = textEntity
}

const regenerateRoundup = async () => {
  if (!competition.value) return

  regeneratingRoundup.value = true
  roundupSuccessMessage.value = ''
  roundupErrorMessage.value = ''

  try {
    const response = await axios.post('/rest/maintain/competition/roundup/regenerate', {
      competitionPath: competition.value.path,
    })
    if (!isRoundupResponse(response.data)) {
      throw new Error('AI roundup response did not include roundup text')
    }
    competition.value.roundup = TextDAO.getByPath(response.data.roundup)
    competition.value.roundupGeneratedAt = response.data.roundupGeneratedAt
    competition.value.roundupModel = response.data.roundupModel
    roundupText.value = {
      ...response.data.roundup,
      text: response.data.roundupText,
      mimeType: 'text/markdown',
    }
    roundupSuccessMessage.value = 'AI roundup regenerated'
  } catch {
    roundupErrorMessage.value = 'AI roundup regeneration failed'
  } finally {
    regeneratingRoundup.value = false
  }
}

const saveRoundupText = async (textEntity: Text) => {
  if (!competition.value) return

  roundupText.value = textEntity
  await TextDAO.save(textEntity)
  competition.value.roundup = TextDAO.getByPath(textEntity)
  await CompetitionDAO.save(competition.value)
  roundupErrorMessage.value = ''
  roundupSuccessMessage.value = 'AI roundup saved'
}

const loadRoundupText = async () => {
  if (!competition.value?.roundup) {
    roundupText.value = undefined
    return
  }

  roundupText.value = await TextDAO.getData(competition.value.roundup)
}

const isRoundupResponse = (
  value: unknown,
): value is {
  roundup: { id: string; path: string }
  roundupText: string
  roundupGeneratedAt?: string
  roundupModel?: string
} =>
  value !== null &&
  typeof value === 'object' &&
  isTextReference((value as { roundup?: unknown }).roundup) &&
  typeof (value as { roundupText?: unknown }).roundupText === 'string' &&
  (value as { roundupText: string }).roundupText.trim().length > 0

const isTextReference = (value: unknown): value is { id: string; path: string } =>
  value !== null &&
  typeof value === 'object' &&
  typeof (value as { id?: unknown }).id === 'string' &&
  typeof (value as { path?: unknown }).path === 'string'

const addText = async () => {
  if (!competition.value) return

  const textReference = newEntityIdentity('text')
  const textEntity = { ...textReference, text: '', mimeType: 'text/html' } as Text
  await TextDAO.save(textEntity)
  competition.value.text = textReference
  await CompetitionDAO.save(competition.value)
  text.value = textEntity
}
</script>
