<template>
  <v-card>
    <v-card-title>Head-to-Head Highlights</v-card-title>
    <v-card-text v-if="leaders">
      <v-row>
        <v-col cols="12" md="6">
          <h3 class="text-subtitle-1 mb-2">Teams beaten most often</h3>
          <v-list v-if="leaders.mostBeaten.length" density="compact">
            <v-list-item
              v-for="leader in leaders.mostBeaten"
              :key="`beaten-${leader.team}`"
              prepend-icon="mdi-trophy"
            >
              <v-list-item-title>{{
                formatLeader(leader.team, leader.win, 'win')
              }}</v-list-item-title>
            </v-list-item>
          </v-list>
          <p v-else class="text-body-2 text-medium-emphasis">No wins recorded.</p>
        </v-col>

        <v-col cols="12" md="6">
          <h3 class="text-subtitle-1 mb-2">Teams who beat this team most often</h3>
          <v-list v-if="leaders.mostLostTo.length" density="compact">
            <v-list-item
              v-for="leader in leaders.mostLostTo"
              :key="`lost-to-${leader.team}`"
              prepend-icon="mdi-alert-circle"
            >
              <v-list-item-title>{{
                formatLeader(leader.team, leader.lose, 'loss', 'losses')
              }}</v-list-item-title>
            </v-list-item>
          </v-list>
          <p v-else class="text-body-2 text-medium-emphasis">No losses recorded.</p>
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

const { headToHeadLeaders } = useTeams()

const leaders = usePromise(() => headToHeadLeaders(props.stats))

const formatCount = (count: number, singular: string, plural = `${singular}s`) =>
  `${count} ${count === 1 ? singular : plural}`

const formatLeader = (team: string, count: number, singular: string, plural = `${singular}s`) =>
  `${team} (${formatCount(count, singular, plural)})`
</script>
