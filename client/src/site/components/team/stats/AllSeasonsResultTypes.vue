<template>
  <v-card>
    <v-card-title>Results</v-card-title>
    <v-card-text>
      <v-container row :width="$vuetify.display.smAndDown ? '300px' : '400px'" height="330px">
        <Pie v-if="stats" :data="data" :options="{ radius: '100%', responsive: true }" />
      </v-container>
    </v-card-text>
  </v-card>
</template>
<script setup lang="ts">
import type Statistics from '@/entity/Statisitics'
import { useTeams } from '@/services/TeamService'
import 'chart.js/auto'
import { computed } from 'vue'
import { Pie } from 'vue-chartjs'

const props = defineProps<{
  stats: Statistics[]
}>()

const { allSeasonsResultTypes } = useTeams()

const data = computed(() => allSeasonsResultTypes(props.stats))
</script>
