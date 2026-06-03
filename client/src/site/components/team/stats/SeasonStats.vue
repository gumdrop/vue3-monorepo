<template>
  <SeasonSelect v-if="seasonId" :seasonId="seasonId" label="Season" :inline="false" @season="setSeason" />
  <v-row wrap v-if="teamId && seasonId && stats.length > 0" class="px-0" justify="space-around">
    <v-col cols="12">
      <SeasonHighlights :stats="stats[0]" />
    </v-col>
    <v-col>
      <SeasonLeaguePosition :stats="stats[0]" />
    </v-col>
    <v-col>
      <SeasonMatchScores :stats="stats[0]" />
    </v-col>
    <v-col>
      <SeasonCumulativeScores :stats="stats[0]" />
    </v-col>
    <v-col>
      <SeasonCumulativePointsDiff :stats="stats[0]" />
    </v-col>
    <v-col>
      <ResultTypes :stats="stats[0]" />
    </v-col>
  </v-row>
</template>
<script setup lang="ts">
import { useCollection } from 'vuefire';
import SeasonLeaguePosition from './SeasonLeaguePosition.vue';
import SeasonMatchScores from './SeasonMatchScores.vue';

import StatisticsDAO from '@/dao/StatisticsDAO';
import { useTeamStore } from '@/stores/teams';
import SeasonSelect from '../../season/SeasonSelect.vue';
import ResultTypes from './ResultTypes.vue';
import SeasonCumulativePointsDiff from './SeasonCumulativePointsDiff.vue';
import SeasonCumulativeScores from './SeasonCumulativeScores.vue';
import SeasonHighlights from './SeasonHighlights.vue';


const props = defineProps<{ teamId: string, }>()

const { seasonId, setSeason } = useTeamStore()

const stats = useCollection(() => seasonId.value ? StatisticsDAO.teamStats(props.teamId, seasonId.value) : undefined)

</script>
