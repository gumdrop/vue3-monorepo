<template>
  <v-card>
    <v-card-title>All Seasons Highlights</v-card-title>
    <v-card-text v-if="highlights">
      <v-row>
        <v-col v-for="highlight in highlights" :key="highlight.title" cols="12" md="6" lg="4">
          <div class="highlight-item">
            <div class="text-caption text-medium-emphasis">{{ highlight.title }}</div>
            <div class="text-h6">{{ highlight.value }}</div>
            <div v-if="highlight.detail" class="text-body-2">{{ highlight.detail }}</div>
          </div>
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import type Statistics from '@/entity/Statisitics'
import { useTeams } from '@/services/TeamService'
import { usePromise } from '@/utils/PromiseRef'

const props = defineProps<{
  stats: Statistics[]
}>()

const { allSeasonsHighlights } = useTeams()

const highlights = usePromise(() => allSeasonsHighlights(props.stats))
</script>

<style scoped>
.highlight-item {
  min-height: 72px;
}
</style>
