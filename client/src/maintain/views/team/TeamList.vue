<template>
  <v-container>
    <v-row>
      <v-col>
        <v-card>
          <v-card-title>
            Teams
            <v-spacer></v-spacer>
            <v-btn color="primary" @click="add">Add Team</v-btn>
          </v-card-title>
          <v-list>
            <v-list-item v-for="team in teams" :key="team.id" :to="'/team/' + team.id">
              <v-list-item-title>{{ team.name }}</v-list-item-title>
              <v-list-item-subtitle>{{ team.shortName }}</v-list-item-subtitle>
            </v-list-item>
          </v-list>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import TeamDAO from '@/dao/TeamDAO'
import type Team from '@/entity/Team'
import { useRouter } from 'vue-router'

const teams = ref<Team[]>([])
const router = useRouter()

onMounted(async () => {
  teams.value = await TeamDAO.list()
})

const add = () => {
  router.push('/team/new')
}
</script>
