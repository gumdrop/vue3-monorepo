<template>
  <v-container v-if="fixtures" :class="gridSize" fluid>
    <v-col v-for="fixs in fixtures" :key="fixs.id">
      <FixturesCard :fixtures="fixs" />
    </v-col>
  </v-container>
</template>
<script setup lang="ts">
import { useFixtures } from '@/services/FixturesService';
import { useLayout } from '@/services/LayoutService';
import { usePromise } from '@/utils/PromiseRef';
import FixturesCard from './FixturesCard.vue';

const props = defineProps<{ seasonId: string }>()

const { activeFixtures } = useFixtures()
const { gridSize } = useLayout()

const fixtures = usePromise(() =>  activeFixtures(props.seasonId))


</script>
