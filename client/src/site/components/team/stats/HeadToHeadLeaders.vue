<template>
  <v-card>
    <v-card-title>Head-to-Head Highlights</v-card-title>
    <v-card-text v-if="leaders">
      <v-row>
        <v-col v-for="section in sections" :key="section.title" cols="12" md="6">
          <h3 class="text-subtitle-1 mb-2">{{ section.title }}</h3>
          <v-list density="compact">
            <v-list-item v-for="item in section.items" :key="item" :prepend-icon="section.icon">
              <v-list-item-title>{{ item }}</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import type Statistics from '@/entity/Statisitics'
import { useTeams } from '@/services/TeamService'
import { usePromise } from '@/utils/PromiseRef'
import { computed } from 'vue'

const props = defineProps<{
  stats: Statistics[]
}>()

const { headToHeadLeaders } = useTeams()

const leaders = usePromise(() => headToHeadLeaders(props.stats))

const formatCount = (count: number, singular: string, plural = `${singular}s`) =>
  `${count} ${count === 1 ? singular : plural}`

const formatLeader = (team: string, count: number, singular: string, plural = `${singular}s`) =>
  `${team} (${formatCount(count, singular, plural)})`

const sections = computed(() =>
  leaders.value
    ? [
        {
          title: 'Teams beaten most often',
          icon: 'mdi-trophy',
          items: leaders.value.mostBeaten.length
            ? leaders.value.mostBeaten.map((leader) => formatLeader(leader.team, leader.win, 'win'))
            : ['No wins recorded.'],
        },
        {
          title: 'Teams who beat this team most often',
          icon: 'mdi-alert-circle',
          items: leaders.value.mostLostTo.length
            ? leaders.value.mostLostTo.map((leader) =>
                formatLeader(leader.team, leader.lose, 'loss', 'losses'),
              )
            : ['No losses recorded.'],
        },
      ]
    : [],
)
</script>
