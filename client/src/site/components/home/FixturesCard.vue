<template>
  <v-card class="mb-1" min-width="100%" :loading="!fixtures" elevation="0">
    <v-card-title primary-title>{{ title }}</v-card-title>
    <v-card-text v-if="fixtures">
      <v-container>
        <v-row>
          <h3 class="headline mb-0">
            {{ date(fixtures.date, 'd MMMM yyyy') }} : {{ fixtures.description }}
            <AISummaryButton :fixtures="fixtures" />
          </h3>
        </v-row>
        <v-row v-if="fixtureList">
          <SimpleFixtures :fixtures="fixtureList" />
        </v-row>
      </v-container>
    </v-card-text>
  </v-card>
</template>
<script setup lang="ts">
import { fixtureDAO } from '@/dao/FixturesDAO'
import type Fixtures from '@/entity/Fixtures'
import { useDateTime } from '@/services/DateService'
import { usePromise } from '@/utils/PromiseRef'
import type { DocumentReference } from 'firebase/firestore'
import { useDocument } from 'vuefire';
import SimpleFixtures from '../fixtures/SimpleFixtures.vue';
import AISummaryButton from '@/site/components/common/AISummaryButton.vue';

const { date } = useDateTime()


const props = defineProps<{ fixtures: DocumentReference<Fixtures>; title: string }>()

const fixtures = useDocument(props.fixtures)

const fixtureList = usePromise(() =>
  fixtures.value
    ? fixtureDAO.collectionToDocuments(fixtureDAO.subCollection(fixtures.value.path))
    : Promise.resolve(undefined),
)
</script>
