<template>
  <FixturesSet :fetch-function="fixtures" title="Next Fixtures" />
</template>
<script setup lang="ts">
import { useFixtures } from '@/services/FixturesService';
import FixturesSet from './FixturesSet.vue';



const { seasonId } = defineProps<{ seasonId: string }>()

const { activeFixtures } = useFixtures()

const fixtures = () => activeFixtures(seasonId, 1)
</script>
