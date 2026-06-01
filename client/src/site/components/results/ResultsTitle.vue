<template>
  <SubTitle v-if="season" title="All Results" icon="mdi-calendar-check" colour="purple-lighten-3">
    <template v-slot:subtitle>
      <div class="text-subtitle-1 opacity-80">{{ formatSeason(season) }}</div>
    </template>
    <template v-slot:actions>
      <div class="season-select-wrapper">
        <SeasonSelect :seasonId="seasonId" :inline="true" @season="setSeason" />
      </div>
    </template>
  </SubTitle>
</template>
<script setup lang="ts">
import SeasonDao from '@/dao/SeasonDAO';
import { useSeason } from '@/services/SeasonService';
import { useResultsStore } from '@/stores/results';
import { useDocument } from 'vuefire';
import SubTitle from '../common/SubTitle.vue';
import SeasonSelect from '../season/SeasonSelect.vue';

const { seasonId, setSeason } = useResultsStore()

const season = useDocument(() => SeasonDao.getById(seasonId.value))
const { formatSeason } = useSeason()

</script>
<style scoped>
.opacity-80 {
  opacity: 0.8;
}

.season-select-wrapper {
  padding: 4px 12px;
  border-radius: 8px;
}
</style>
