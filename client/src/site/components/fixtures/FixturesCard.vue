<template>
  <v-card class="fixtures-card mb-4 elevation-2" :loading="!fixtureList">
    <div v-if="fixtures && parent" class="card-inner">
      <div class="card-header">
        <div class="header-main">
          <span class="header-date">{{ date(fixtures.date, 'd MMM yyyy') }}</span>
          <span class="header-sep">|</span>
          <span class="header-comp">{{ parent.name }}</span>
          <AISummaryButton :fixtures="fixtures" :parent-name="parent.name" />
        </div>
        <div v-if="fixtures.description" class="header-sub">
          {{ fixtures.description }}
        </div>
      </div>
      <v-card-text class="pa-0">
        <v-container fluid class="pa-0">
          <v-row v-if="fixtureList" no-gutters>
            <SimpleFixtures :fixtures="fixtureList" />
          </v-row>
        </v-container>
      </v-card-text>
    </div>
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
import AISummaryButton from '@/site/components/common/AISummaryButton.vue';
const { parseParent } = useKey()


const { date } = useDateTime()

const props = defineProps<{ fixtures: DocumentReference<Fixtures> }>()

const fixtures = useDocument(props.fixtures)

const fixtureList = usePromise(() =>
  props.fixtures.path
    ? fixtureDAO.collectionToDocuments(fixtureDAO.subCollection(props.fixtures.path))
    : Promise.resolve(undefined),
)

const parent = useDocument(CompetitionDAO.getByPath(parseParent(props.fixtures.path)))


</script>
<style scoped>
.fixtures-card {
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.card-header {
  padding: 16px 20px;
  background-color: rgba(var(--v-theme-on-surface), 0.04);
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.header-main {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.header-date {
  font-size: 1.1rem;
  font-weight: 700;
  color: rgb(var(--v-theme-on-surface));
}

.header-sep {
  color: rgba(var(--v-theme-on-surface), 0.3);
  font-weight: 300;
}

.header-comp {
  font-size: 1rem;
  font-weight: 600;
  color: rgb(var(--v-theme-info));
}

.header-sub {
  margin-top: 4px;
  font-size: 0.85rem;
  font-weight: 500;
  color: rgba(var(--v-theme-on-surface), 0.6);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

@media (max-width: 600px) {
  .card-header {
    padding: 12px 16px;
  }
  .header-date {
    font-size: 1rem;
  }
  .header-comp {
    font-size: 0.9rem;
  }
}
</style>
