<template>
  <v-card class="rounded-0 rounded-sm-md elevation-0 elevation-sm-1">
    <v-card-text class="px-0 px-sm-4">
      <v-row justify="center" class="mb-1">
        <v-tabs ripple v-model="activeTab" slider-color="yellow" @click="haltTabs()">
          <v-tab :key="1">Tables</v-tab>
          <v-tab :key="2">Results</v-tab>
          <v-tab :key="3">Fixtures</v-tab>
          <v-tab :key="4">Events</v-tab>
        </v-tabs>
      </v-row>
      <v-tabs-window v-model="activeTab" v-if="seasonId">
        <v-tabs-window-item :key="1">
          <LeagueTables style="min-width:300px" :seasonId="seasonId" />
        </v-tabs-window-item>
        <v-tabs-window-item :key="2">
          <LatestResults style="min-width:300px" :seasonId="seasonId" />
        </v-tabs-window-item>
        <v-tabs-window-item :key="3">
          <NextFixtures style="min-width:300px" :seasonId="seasonId" />
        </v-tabs-window-item>
        <v-tabs-window-item :key="4">
          <EventsTab :seasonId="seasonId" />
        </v-tabs-window-item>
      </v-tabs-window>
    </v-card-text>
  </v-card>
</template>
<script setup lang="ts">
import { useAppContextStore } from '@/stores/app';
import { onMounted, ref } from 'vue';
import NextFixtures from './NextFixtures.vue';
import LatestResults from './LatestResults.vue';
import LeagueTables from './LeagueTables.vue';
import EventsTab from './EventsTab.vue';

const { seasonId } = useAppContextStore()
const activeTab = ref<number>(0)
const intervalId = ref<number>()

const haltTabs = () => {
  clearInterval(intervalId.value)
  intervalId.value = 0
}

onMounted(() => {
  intervalId.value = setInterval(() => {
    activeTab.value = activeTab.value == 3 ? 0 : activeTab.value + 1
  }, 5000)
})


</script>
