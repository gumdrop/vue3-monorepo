<template>
  <v-card class="mb-1" min-width="100%" :loading="!fixtureList">
    <v-card-text v-if="fixtures && parent">
      <v-card-title primary-title>
        <ResponsiveHeader>{{ date(fixtures.date, 'd MMM yyyy') }} - {{ parent.name }} {{ fixtures.description }}
        </ResponsiveHeader>
      </v-card-title>
      <v-container>
        <v-row v-if="fixtureList">
          <SimpleFixtures :fixtures="fixtureList" />
        </v-row>
      </v-container>
    </v-card-text>
  </v-card>
</template>
<script setup lang="ts">
import CompetitionDAO from '@/dao/CompetitionDAO';
import { fixtureDAO } from '@/dao/FixturesDAO';
import Fixtures from '@/entity/Fixtures';
import { useDateTime } from '@/services/DateService';
import { useKey } from '@/services/KeyService';
import { usePromise } from '@/utils/PromiseRef';
import { DocumentReference } from 'firebase/firestore';
import { useDocument } from 'vuefire';
import SimpleFixtures from '../fixtures/SimpleFixtures.vue';
const { parseParent } = useKey()


const { date } = useDateTime()

const props = defineProps<{ fixtures: DocumentReference<Fixtures> }>()

const fixtures = useDocument(props.fixtures)

const fixtureList = usePromise(() => fixtureDAO.collectionToDocuments(fixtureDAO.subCollection(`${fixtures?.value?.path}`)))

const parent = useDocument(CompetitionDAO.getByPath(parseParent(props.fixtures.path)))


</script>
