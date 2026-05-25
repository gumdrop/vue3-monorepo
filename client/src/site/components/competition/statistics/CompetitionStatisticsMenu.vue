<template>
  <SideMenu title="Roll Of Honour" icon="mdi-script" v-if="rollOfHonour.length">
    <SideMenuItem
      v-for="statistics in rollOfHonour"
      :key="statistics.id"
      :to="`/competition/rollofhonour/${competitionStatisticsSlug(statistics)}`"
      :title="statistics.competitionName"
    />
  </SideMenu>
</template>

<script setup lang="ts">
import SideMenu from '../../common/SideMenu.vue'
import SideMenuItem from '../../common/SideMenuItem.vue'
import {
  competitionStatisticsSlug,
  useCompetitionStatisticsEntries,
} from './useCompetitionStatisticsEntry'

const { rollOfHonour } = useCompetitionStatisticsEntries()
</script>
