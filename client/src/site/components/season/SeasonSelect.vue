<template>
  <component
    :is="toolbar ? 'div' : 'h2'"
    v-if="seasons && seasons.length > 0 && selectedSeason"
    class="season-select"
    :class="{ 'season-select--toolbar': toolbar }"
    :style="topOffset()"
  >
    <v-select :style="selectOffset()" :items="wrap(sort(seasons))" item-title="title" item-value="value"
      v-model="selectedSeason" :label="label" :disabled="disabled" :solo-inverted="inline" :flat="inline"
      :density="toolbar ? 'compact' : undefined" :hide-details="toolbar"
      bg-color="transparent" @update:model-value="$emit('season', selectedSeason)">
    </v-select>
  </component>
</template>
<script setup lang="ts">
import SeasonDao from '@/dao/SeasonDAO';
import type Season from '@/entity/Season';
import { useSeason } from '@/services/SeasonService';
import { ref, watch } from 'vue';
import { useCollection } from 'vuefire';

const props = defineProps<{
  seasonId: string | undefined,
  inline: boolean,
  disabled?: boolean,
  label?: string,
  toolbar?: boolean
}>()

const seasons = useCollection(() => SeasonDao.collection(), { maxRefDepth: 1 })

const selectedSeason = ref(props.seasonId)

const { formatSeason } = useSeason()

const wrap = (seasons: Season[]) => seasons.map(s => { return { title: formatSeason(s), value: s.id } })
const sort = (seasons: Season[]) => seasons.sort((a, b) => b.startYear - a.startYear)
const topOffset = () => (props.inline && !props.toolbar) ? "position:relative;top:-4px;" : ""
const selectOffset = () => props.toolbar ? "" : "top:5px;"

watch(() => props.seasonId, (id) => {
  selectedSeason.value = id
})

</script>
<style scoped>
.season-select--toolbar {
  line-height: 1;
  margin: 0;
  min-width: 150px;
  width: 150px;
}

@media (max-width: 600px) {
  .season-select--toolbar {
    min-width: 0;
    width: 100%;
  }
}
</style>
