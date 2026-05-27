<template>
  <v-card class="fixtures-card mb-4 elevation-2" :loading="!fixtures">
    <div v-if="fixtures" class="card-inner">
      <div class="card-header">
        <div class="header-main">
          <span class="header-date">{{ date(fixtures.date, 'd MMMM yyyy') }}</span>
          <span v-if="fixtures.description" class="header-sep">|</span>
          <span v-if="fixtures.description" class="header-desc">{{ fixtures.description }}</span>
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
import { fixtureDAO } from '@/dao/FixturesDAO';
import Fixtures from '@/entity/Fixtures';
import { useDateTime } from '@/services/DateService';
import { usePromise } from '@/utils/PromiseRef';
import { DocumentReference } from 'firebase/firestore';
import { useDocument } from 'vuefire';
import SimpleFixtures from '../fixtures/SimpleFixtures.vue';


const { date } = useDateTime()

const props = defineProps<{ fixtures: DocumentReference<Fixtures> }>()

const fixtures = useDocument(() => props.fixtures)


const fixtureList = usePromise(() => fixtureDAO.collectionToDocuments(fixtureDAO.subCollection(`${fixtures?.value?.path}`)))

</script>
<style scoped>
.fixtures-card {
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.card-header {
  padding: 16px 20px;
  background-color: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
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
  color: #1e293b;
}

.header-sep {
  color: #cbd5e1;
  font-weight: 300;
}

.header-desc {
  font-size: 1rem;
  font-weight: 600;
  color: #3b82f6;
}

@media (max-width: 600px) {
  .card-header {
    padding: 12px 16px;
  }
  .header-date {
    font-size: 1rem;
  }
  .header-desc {
    font-size: 0.9rem;
  }
}
</style>
