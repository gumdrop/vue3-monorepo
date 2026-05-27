<template>
  <v-card v-if="fixtures" class="fixtures-set-card elevation-2 overflow-hidden mb-6">
    <v-toolbar color="grey-lighten-4" density="compact" flat>
      <v-toolbar-title class="text-subtitle-2 font-weight-bold grey--text text--darken-2">
        Team {{ title }}
      </v-toolbar-title>
      <v-spacer></v-spacer>
      <div class="header-actions px-2">
        <slot></slot>
      </div>
    </v-toolbar>
    
    <v-card-text class="pa-0">
      <div class="fixtures-list bg-white">
        <SimpleFixtures :fixtures="fixtures" inline-details />
      </div>
    </v-card-text>
    
    <v-divider></v-divider>
    
    <v-card-actions class="pa-2 bg-grey-lighten-5">
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
  border: 1px solid #e2e8f0 !important;
}

.header-actions {
  display: flex;
  align-items: center;
}
</style>
