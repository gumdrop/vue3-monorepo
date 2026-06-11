<template>
  <v-card v-if="roundupId" class="competition-roundup mb-6 elevation-2">
    <v-toolbar color="primary" density="compact" flat>
      <v-icon color="white" start class="ml-4">mdi-auto-awesome</v-icon>
      <v-toolbar-title class="text-subtitle-1 font-weight-bold white--text">
        Roundup
      </v-toolbar-title>
    </v-toolbar>
    <v-card-text class="pa-6">
      <QlText :id="roundupId" />
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import type Competition from '@/entity/Competition'
import { computed } from 'vue'
import QlText from '../text/QlText.vue'

const props = defineProps<{
  competition?: Competition
}>()

const roundupId = computed(() => props.competition?.roundup?.id)
</script>

<style scoped>
.competition-roundup {
  border-radius: 12px;
  overflow: hidden;
}
</style>
