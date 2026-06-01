<template>
  <div v-if="item && season" class="competition-header pa-4 mb-4">
    <PageTitle :title="`${item.name} ${formatSeason(season)}`" />
    <div class="d-flex align-center">
      <div class="header-icon-wrapper mr-4">
        <v-icon color="white" size="32">{{ item.icon || 'mdi-trophy' }}</v-icon>
      </div>
      <div>
        <h1 class="text-h4 font-weight-bold white--text">{{ item.name }}</h1>
        <div class="text-subtitle-1 white--text opacity-80">{{ formatSeason(season) }}</div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { computed } from 'vue';
import { useKey } from '@/services/KeyService';
import { useDocument } from 'vuefire';
import CompetitionDAO from '@/dao/CompetitionDAO';
import SeasonDao from '@/dao/SeasonDAO';
import { useSeason } from '@/services/SeasonService';
import PageTitle from '../common/PageTitle.vue';

const { decode, parseParent } = useKey()
const { formatSeason } = useSeason()

const props = defineProps<{ path: string }>()
const path = computed(() => decode(props.path))

const item = useDocument(() => CompetitionDAO.getByPath(path.value))
const season = useDocument(() => SeasonDao.getByPath(parseParent(path.value)))
</script>
<style scoped>
.competition-header {
  background: linear-gradient(135deg, #6b21a8 0%, #a855f7 100%);
  border-radius: 12px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  color: white;
}

.header-icon-wrapper {
  background-color: rgba(255, 255, 255, 0.2);
  padding: 12px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.opacity-80 {
  opacity: 0.8;
}

h1 {
  margin: 0;
  line-height: 1.2;
}
</style>
