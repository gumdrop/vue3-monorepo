<template>
  <v-toolbar color="purple-lighten-3" class="subtitle-background" density="compact" elevation="3"
    style="color:black !important">
    <v-toolbar-title v-if="item && season">
      <PageTitle :title="`${item.name} ${formatSeason(season)}`" />
      <v-icon v-if="item.icon" style="position:relative;top:-2px">{{ item.icon }}</v-icon>&nbsp;&nbsp;<span>{{ item.name
        }}
        {{ formatSeason(season) }}</span>
    </v-toolbar-title>
    <v-spacer></v-spacer>
  </v-toolbar>
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
