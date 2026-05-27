<template>
  <v-container :class="gridSize" class="pa-0">
    <v-row no-gutters>
      <v-col cols="12">
        <v-card class="stats-card elevation-2 overflow-hidden">
          <v-tabs 
            v-model="tab" 
            bg-color="grey-lighten-4" 
            color="primary" 
            align-tabs="start"
            density="comfortable"
          >
            <v-tab value="one" class="text-none font-weight-bold">
              <v-icon start>mdi-chart-timeline-variant</v-icon>
              Single Season
            </v-tab>
            <v-tab value="two" class="text-none font-weight-bold">
              <v-icon start>mdi-chart-areaspline</v-icon>
              All Seasons
            </v-tab>
            <v-tab value="three" class="text-none font-weight-bold">
              <v-icon start>mdi-compare-horizontal</v-icon>
              Head-to-Head
            </v-tab>
          </v-tabs>
          
          <v-divider></v-divider>
          
          <v-tabs-window v-model="tab">
            <v-tabs-window-item value="one">
              <v-container class="pa-6" fluid>
                <SeasonStats :teamId="id" />
              </v-container>
            </v-tabs-window-item>

            <v-tabs-window-item value="two">
              <v-container class="pa-6" fluid>
                <AllSeasonsStats :teamId="id" />
              </v-container>
            </v-tabs-window-item>

            <v-tabs-window-item value="three">
              <v-container class="pa-6" fluid>
                <HeadToHead :team-id="id" />
              </v-container>
            </v-tabs-window-item>
          </v-tabs-window>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>
<script setup lang="ts">
import { useLayout } from '@/services/LayoutService';

import { ref } from 'vue';
import SeasonStats from './SeasonStats.vue';
import AllSeasonsStats from './AllSeasonsStats.vue';
import HeadToHead from './HeadToHead.vue';

defineProps<{ id: string }>()

const { gridSize } = useLayout()

const tab = ref("one")
</script>
<style scoped>
.stats-card {
  border-radius: 16px !important;
}

:deep(.v-tab) {
  letter-spacing: 0;
  font-size: 0.9rem;
}
</style>
