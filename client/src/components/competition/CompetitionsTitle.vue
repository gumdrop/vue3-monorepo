<template>
  <v-toolbar color="purple-lighten-3" density="compact" elevation="3" class="subtitle-background"
    style="color:black !important">
    <QlTitle v-if="season" :title="`Competitions ${formatSeason(season)}`" />
    <v-toolbar-title>
      Competitions
    </v-toolbar-title>
    <v-toolbar-items>
      <SeasonSelect :seasonId="seasonId" :inline="true" @season="setSeason" />
    </v-toolbar-items>
  </v-toolbar>
</template>
<script setup lang="ts">
import SeasonDao from '@/dao/SeasonDAO';
import { useSeason } from '@/services/SeasonService';
import { useCompetition } from '@/stores/competiton';
import { useDocument } from 'vuefire';
import QlTitle from '../common/PageTitle.vue';
import SeasonSelect from '../season/SeasonSelect.vue';

const { seasonId, setSeason } = useCompetition()

const season = useDocument(() => SeasonDao.getById(seasonId.value))
const { formatSeason } = useSeason()

</script>
