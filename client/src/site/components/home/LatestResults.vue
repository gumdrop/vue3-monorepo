<template>
  <FixturesSet :fetch-function="fixtures" title="Latest Results" />
</template>
<script setup lang="ts">
import { useFixtures } from '@/services/FixturesService';
import FixturesSet from './FixturesSet.vue';



const { seasonId } = defineProps<{ seasonId: string }>()

const { spentFixturesForDay } = useFixtures()

const fixtures = () => spentFixturesForDay(seasonId)
</script>
