<template>
  <div v-if="results" class="fixtures-set-wrapper mb-8">
    <v-card class="fixtures-set-header-card elevation-2 mb-4 overflow-hidden">
      <v-toolbar color="primary" density="compact" flat>
        <v-toolbar-title class="text-subtitle-1 font-weight-bold white--text">
          {{ title }}
        </v-toolbar-title>
        <v-spacer></v-spacer>
        <div class="px-2">
          <FetchActions :initial-fetch="1" @fetch="(fetch) => fetchSize = fetch" />
        </div>
      </v-toolbar>
    </v-card>

    <div class="fixtures-cards-container">
      <FixturesCard :fixtures="result" v-for="result in results" :key="result.id" />
    </div>
  </div>
</template>
<script setup lang="ts">
import type Fixtures from '@/entity/Fixtures';
import { usePromise } from '@/utils/PromiseRef';
import type { DocumentReference } from 'firebase/firestore';
import { ref } from 'vue';
import FixturesCard from './FixturesCard.vue';
import FetchActions from '../common/FetchActions.vue';

const props = defineProps<{
  path: string,
  title: string,
  fetchFunction: (key: string, fetch?: number) => Promise<DocumentReference<Fixtures>[]>
}>()

const fetchSize = ref<number | undefined>(1)

const results = usePromise(() => props.fetchFunction(props.path, fetchSize.value))
</script>
<style scoped>
.fixtures-set-header-card {
  border-radius: 12px !important;
}

.fixtures-cards-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
</style>
