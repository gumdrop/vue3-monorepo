<template>
  <v-row wrap v-if="teamId && stats.length > 1" class="px-0" justify="space-around">
    <v-col cols="12">
      <AllSeasonsHighlights :stats="stats" />
    </v-col>
    <v-col>
      <AllSeasonsLeaguePosition :stats="stats" />
    </v-col>
    <v-col>
      <AllSeasonsAverage :stats="stats" />
    </v-col>
    <v-col>
      <AllSeasonsResultTypes :stats="stats" />
    </v-col>
  </v-row>
</template>
<script setup lang="ts">
import { useCollection } from 'vuefire'

import StatisticsDAO from '@/dao/StatisticsDAO'
import AllSeasonsAverage from './AllSeasonsAverage.vue'
import AllSeasonsHighlights from './AllSeasonsHighlights.vue'
import AllSeasonsLeaguePosition from './AllSeasonsLeaguePosition.vue'
import AllSeasonsResultTypes from './AllSeasonsResultTypes.vue'

const props = defineProps<{ teamId: string }>()

const stats = useCollection(() => StatisticsDAO.allTeamStats(props.teamId), { maxRefDepth: 1 })
</script>
