<template>
  <v-col v-if="results">
    <v-card>
      <v-card-title>{{ title }}</v-card-title>
      <v-card-actions>
        <FetchActions :initial-fetch="1" @fetch="(fetch) => fetchSize = fetch" />
      </v-card-actions>
    </v-card>

    <FixturesCard :fixtures="result" v-for="result in results" :key="result.id" />

  </v-col>
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
