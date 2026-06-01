<template>
  <v-container>
    <v-row>
      <v-col>
        <v-card>
          <v-card-title>
            Seasons
            <v-spacer></v-spacer>
            <v-btn color="primary" @click="add">Add Season</v-btn>
          </v-card-title>
          <v-list>
            <v-list-item v-for="season in seasons" :key="season.id" :to="'/season/' + season.id">
              <v-list-item-title>{{ season.startYear }}/{{ season.endYear }}</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import SeasonDAO from '@/dao/SeasonDAO'
import type Season from '@/entity/Season'
import { useRouter } from 'vue-router'

const seasons = ref<Season[]>([])
const router = useRouter()

onMounted(async () => {
  const list = await SeasonDAO.list()
  seasons.value = list.sort((a, b) => Number(b.startYear) - Number(a.startYear))
})

const add = () => {
  router.push('/season/new')
}
</script>
