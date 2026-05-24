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
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import CompetitionDAO from '@/dao/CompetitionDAO'
import FixturesDAO from '@/dao/FixturesDAO'
import LeagueTableDAO from '@/dao/LeagueTableDAO'
import TextDAO from '@/dao/TextDAO'
import type Competition from '@/entity/Competition'
import type Fixtures from '@/entity/Fixtures'
import type LeagueTable from '@/entity/LeagueTable'
import type Text from '@/entity/Text'
import { useValidations } from '@/site/components/Validation'
import TextEdit from '@/site/components/text/TextEdit.vue'

const route = useRoute()
const router = useRouter()
const rules = useValidations()

const competition = ref<any | null>(null)
const fixtures = ref<Fixtures[]>([])
const leagueTables = ref<LeagueTable[]>([])
const text = ref<Text | undefined>()
const valid = ref(false)

const isNew = computed(() => route.params.id === 'new')
const seasonId = computed(() => route.params.seasonId as string)
const hasTextReference = computed(() => {
  return Boolean(competition.value?.text?.id && competition.value?.text?.path)
})

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
    }
  }
})

const save = async () => {
  if (competition.value) {
    if (text.value) {
      await TextDAO.save(text.value)
    }
    if (isNew.value) {
      competition.value.id = competition.value.name.toLowerCase().replace(/\s+/g, '-')
      competition.value.path = `season/${seasonId.value}/competition/${competition.value.id}`
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

const addText = async () => {
  if (!competition.value) return

  const textId = `${seasonId.value}-${competition.value.id}-text`
  const textEntity = { id: textId, path: `text/${textId}`, text: '', mimeType: 'text/html' } as Text
  await TextDAO.save(textEntity)
  competition.value.text = { id: textId, path: `text/${textId}` }
  await CompetitionDAO.save(competition.value)
  text.value = textEntity
}
</script>
