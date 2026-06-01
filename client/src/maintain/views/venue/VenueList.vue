<template>
  <v-container>
    <v-row>
      <v-col>
        <v-card>
          <v-card-title>
            Venues
            <v-spacer></v-spacer>
            <v-btn color="primary" @click="add">Add Venue</v-btn>
          </v-card-title>
          <v-list>
            <v-list-item v-for="venue in venues" :key="venue.id" :to="'/venue/' + venue.id">
              <v-list-item-title>{{ venue.name }}</v-list-item-title>
              <v-list-item-subtitle>{{ venue.address }}</v-list-item-subtitle>
            </v-list-item>
          </v-list>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import VenueDAO from '@/dao/VenueDAO'
import type Venue from '@/entity/Venue'
import { useRouter } from 'vue-router'

const venues = ref<Venue[]>([])
const router = useRouter()

onMounted(async () => {
  venues.value = await VenueDAO.list()
})

const add = () => {
  router.push('/venue/new')
}
</script>
