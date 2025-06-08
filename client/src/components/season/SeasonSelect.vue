<template>
  <h2 v-if="seasons && seasons.length > 0 && selectedSeason" :style="topOffset()">
    <v-select style="top:5px;" :items="wrap(sort(seasons))" item-title="title" item-value="value"
      v-model="selectedSeason" :label="label" :disabled="disabled" :solo-inverted="inline" :flat="inline"
      bg-color="transparent" @update:model-value="$emit('season', selectedSeason)">
    </v-select>
  </h2>
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
  label?: string
}>()

const seasons = useCollection(() => SeasonDao.collection(), { maxRefDepth: 1 })

const selectedSeason = ref(props.seasonId)

const { formatSeason } = useSeason()

const wrap = (seasons: Season[]) => seasons.map(s => { return { title: formatSeason(s), value: s.id } })
const sort = (seasons: Season[]) => seasons.sort((a, b) => b.startYear - a.startYear)
const topOffset = () => props.inline ? "position:relative;top:-4px;" : ""

watch(() => props.seasonId, (id) => {
  selectedSeason.value = id
})

</script>
