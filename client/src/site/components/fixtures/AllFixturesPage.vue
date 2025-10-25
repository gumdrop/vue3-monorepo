<template>
  <AllFixtures v-if="seasonId" :seasonId="seasonId" />
</template>
<script setup lang="ts">
import { useAppContextStore } from '@/stores/app';
import AllFixtures from './AllFixtures.vue';

const { seasonId } = useAppContextStore()

</script>
