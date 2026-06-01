<template>
  <v-container>
    <v-row>
      <v-col>
        <v-card>
          <v-card-title>
            Competition Statistics
            <v-spacer></v-spacer>
            <v-btn color="primary" @click="add">Add Competition Statistics</v-btn>
          </v-card-title>
          <v-list>
            <v-list-item
              v-for="statistics in competitionStatistics"
              :key="statistics.id"
              :to="'/competitionstatistics/' + statistics.id"
            >
              <v-list-item-title>{{ statistics.competitionName }}</v-list-item-title>
              <v-list-item-subtitle>
                {{ statistics.results.length }} results
              </v-list-item-subtitle>
            </v-list-item>
          </v-list>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import CompetitionStatisticsDAO from '@/dao/CompetitionStatisticsDAO'
import type CompetitionStatistics from '@/entity/CompetitionStatistics'

const competitionStatistics = ref<CompetitionStatistics[]>([])
const router = useRouter()

onMounted(async () => {
  competitionStatistics.value = (await CompetitionStatisticsDAO.list()).sort((left, right) =>
    left.competitionName.localeCompare(right.competitionName),
  )
})

const add = () => {
  router.push('/competitionstatistics/new')
}
</script>
