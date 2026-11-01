<template>
  <v-card v-if="fixtures" class="fixtures-set-card elevation-2 overflow-hidden mb-6">
    <div class="fixtures-set-header">
      <h2 class="fixtures-set-title text-subtitle-2 font-weight-bold">
        Team {{ title }}
      </h2>
      <div class="header-actions">
        <slot></slot>
      </div>
    </div>
    
    <v-card-text class="pa-0">
      <div class="fixtures-list">
        <SimpleFixtures :fixtures="fixtures" inline-details />
      </div>
    </v-card-text>
    
    <v-divider></v-divider>
    
    <v-card-actions class="fixtures-set-actions pa-2">
      <FetchActions :initial-fetch="initialFetch" @fetch="(fetch) => fetchSize = fetch" />
    </v-card-actions>
  </v-card>
</template>
<script setup lang="ts">
import type { Fixture } from '@/entity/Fixtures';
import { usePromise } from '@/utils/PromiseRef';
import type { DocumentReference } from 'firebase/firestore';
import { ref } from 'vue';
import SimpleFixtures from '../fixtures/SimpleFixtures.vue';
import FetchActions from '../common/FetchActions.vue';

const props = defineProps<{
  teamId: string,
  title: string,
  initialFetch: number,
  fetchFunction: (teamId: string, take?: number) => Promise<DocumentReference<Fixture>[]>
}>()

const fetchSize = ref<number | undefined>(props.initialFetch)

const fixtures = usePromise(() => props.fetchFunction(props.teamId, fetchSize.value))

</script>
<style scoped>
.fixtures-set-card {
  border-radius: 16px !important;
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity)) !important;
}

.fixtures-set-header {
  align-items: center;
  background: rgba(var(--v-theme-on-surface), 0.05);
  color: rgba(var(--v-theme-on-surface), 0.87);
  display: flex;
  gap: 12px;
  justify-content: space-between;
  min-height: 56px;
  padding: 8px 16px;
}

.fixtures-set-actions {
  background-color: rgba(var(--v-theme-on-surface), 0.04);
}

.fixtures-set-title {
  flex: 1 1 auto;
  margin: 0;
  min-width: 0;
}

.header-actions {
  display: flex;
  align-items: center;
  flex: 0 0 auto;
  overflow: visible;
}

@media (max-width: 600px) {
  .fixtures-set-header {
    align-items: stretch;
    flex-direction: column;
    gap: 8px;
    min-height: 0;
    padding: 12px 16px;
  }

  .fixtures-set-title {
    flex: none;
  }

  .header-actions {
    flex: none;
    justify-content: flex-start;
    width: 100%;
  }

  .header-actions :deep(.season-select--toolbar) {
    min-width: 0;
    width: 100%;
  }
}
</style>
