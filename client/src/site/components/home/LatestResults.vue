<template>
  <FixturesSet :fetch-function="fixtures" title="Latest Results" />
</template>
<script setup lang="ts">
import { useFixtures } from '@/services/FixturesService';
import FixturesSet from './FixturesSet.vue';



const { seasonId } = defineProps<{ seasonId: string }>()

const { spentFixtures } = useFixtures()

const fixtures = () => spentFixtures(seasonId, 1)
</script>
