<template>
  <QlSideMenu :title="menuTitle" icon="mdi-chart-timeline-variant" v-if="selectedCompetition">
    <SideMenuItem to="/analytics" icon="mdi-chart-box-outline" title="Overview" />
    <SideMenuItem
      v-if="hasReplay"
      to="/analytics/replay"
      icon="mdi-play-box-multiple-outline"
      title="Replay"
    />
  </QlSideMenu>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import { useSideMenuStore } from '@/stores/app'
import QlSideMenu from '../common/SideMenu.vue'
import SideMenuItem from '../common/SideMenuItem.vue'
import { hasReplayPane, useAnalyticsSelection } from './analyticsState'

const { setSidemenu } = useSideMenuStore()
const { selectedCompetition } = useAnalyticsSelection()

const hasReplay = computed(() => hasReplayPane(selectedCompetition.value))

const menuTitle = computed(() => selectedCompetition.value?.competitionName ?? 'Analytics')

watch(
  selectedCompetition,
  (competition) => {
    setSidemenu(Boolean(competition))
  },
  { immediate: true },
)
</script>
