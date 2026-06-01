<template>
  <div v-if="results">
    <FixturesCard :fixtures="result" v-for="result in results" :key="result.id" :title="title" />
  </div>
</template>
<script setup lang="ts">
import type Fixtures from '@/entity/Fixtures';
import { usePromise } from '@/utils/PromiseRef';
import type { DocumentReference } from 'firebase/firestore';
import FixturesCard from '@/site/components/home/FixturesCard.vue';

const props = defineProps<{
  title: string,
  fetchFunction: () => Promise<DocumentReference<Fixtures>[]>
}>()

const results = usePromise(() => props.fetchFunction())

</script>
