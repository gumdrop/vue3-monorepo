<template>
  <v-container>
    <v-row>
      <v-col>
        <v-card>
          <v-card-title>
            Site Users
            <v-spacer></v-spacer>
            <v-btn color="primary" @click="add">Add Site User</v-btn>
          </v-card-title>
          <v-list>
            <v-list-item v-for="user in siteUsers" :key="user.id" :to="'/siteuser/' + user.id">
              <v-list-item-title>{{ user.handle }}</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import SiteUserDAO from '@/dao/SiteUserDAO'
import type SiteUser from '@/entity/SiteUser'
import { useRouter } from 'vue-router'

const siteUsers = ref<SiteUser[]>([])
const router = useRouter()

onMounted(async () => {
  siteUsers.value = await SiteUserDAO.list()
})

const add = () => {
  router.push('/siteuser/new')
}
</script>
