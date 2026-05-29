<template>
  <div v-if="results" class="fixtures-set-wrapper mb-8">
    <v-card class="fixtures-set-header-card elevation-2 mb-4 overflow-hidden">
      <div class="fixtures-set-header">
        <h2 class="fixtures-set-title text-subtitle-1 font-weight-bold">
          {{ title }}
        </h2>
        <div class="fixtures-set-actions">
          <FetchActions class="fixtures-fetch-actions" :initial-fetch="1" @fetch="(fetch) => fetchSize = fetch" />
        </div>
      </div>
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

.fixtures-set-header {
  align-items: center;
  background: rgb(var(--v-theme-primary));
  color: rgb(var(--v-theme-on-primary));
  display: flex;
  gap: 12px;
  justify-content: space-between;
  min-height: 48px;
  padding: 8px 16px;
}

.fixtures-set-title {
  flex: 1 1 auto;
  margin: 0;
  min-width: 0;
}

.fixtures-set-actions {
  display: flex;
  flex: 0 0 auto;
}

.fixtures-cards-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

@media (max-width: 600px) {
  .fixtures-set-header {
    align-items: stretch;
    flex-direction: column;
    gap: 8px;
  }

  .fixtures-set-title,
  .fixtures-set-actions,
  .fixtures-fetch-actions {
    flex: none;
    width: 100%;
  }

  .fixtures-fetch-actions :deep(.v-btn) {
    flex: 1 1 0;
    min-width: 0;
  }
}
</style>
