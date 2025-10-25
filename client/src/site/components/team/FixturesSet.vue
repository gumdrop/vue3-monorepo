<template>

  <v-card v-if="fixtures">
    <v-card-title>{{ title }}</v-card-title>
    <v-card-actions>
      <FetchActions :initial-fetch="initialFetch" @fetch="(fetch) => fetchSize = fetch" />
      <slot></slot>
    </v-card-actions>
    <v-card-text>
      <v-col>
        <SimpleFixtures :fixtures="fixtures" inline-details />
      </v-col>
    </v-card-text>
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
