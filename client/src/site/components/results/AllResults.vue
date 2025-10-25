<template>
  <v-container v-if="fixtures" :class="gridSize" fluid>
    <v-col v-for="fixs in fixtures" :key="fixs.id">
      <FixturesCard :fixtures="fixs" />
    </v-col>
  </v-container>
</template>
<script setup lang="ts">
import FixturesCard from '@/site/components/fixtures/FixturesCard.vue';
import { useFixtures } from '@/services/FixturesService';
import { useLayout } from '@/services/LayoutService';
import { useResultsStore } from '@/stores/results';
import { usePromise } from '@/utils/PromiseRef';

const { spentFixtures } = useFixtures()
const { gridSize } = useLayout()
const { seasonId } = useResultsStore()

const fixtures = usePromise(() => spentFixtures(`${seasonId?.value}`))


</script>
