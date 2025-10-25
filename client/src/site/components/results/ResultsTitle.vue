<template>
  <v-toolbar color="purple-lighten-3" density="compact" elevation="3" class="subtitle-background"
    style="color:black !important">
    <QlTitle v-if="season" :title="`All Results ${formatSeason(season)}`" />
    <v-toolbar-title>
      All Results
    </v-toolbar-title>
    <v-toolbar-items>
      <SeasonSelect :seasonId="seasonId" :inline="true" @season="setSeason" />
    </v-toolbar-items>
  </v-toolbar>
</template>
<script setup lang="ts">
import SeasonDao from '@/dao/SeasonDAO';
import { useSeason } from '@/services/SeasonService';
import { useResultsStore } from '@/stores/results';
import { useDocument } from 'vuefire';
import QlTitle from '../common/PageTitle.vue';
import SeasonSelect from '../season/SeasonSelect.vue';

const { seasonId, setSeason } = useResultsStore()

const season = useDocument(() => SeasonDao.getById(seasonId.value))
const { formatSeason } = useSeason()

</script>
