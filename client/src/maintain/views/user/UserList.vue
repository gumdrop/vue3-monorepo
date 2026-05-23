<template>
  <v-container>
    <v-row>
      <v-col>
        <v-card>
          <v-card-title>
            Users
            <v-spacer></v-spacer>
            <v-btn color="primary" @click="add">Add User</v-btn>
          </v-card-title>
          <v-list>
            <v-list-item v-for="user in users" :key="user.id" :to="'/user/' + user.id">
              <v-list-item-title>{{ user.name }}</v-list-item-title>
              <v-list-item-subtitle>{{ user.email }}</v-list-item-subtitle>
            </v-list-item>
          </v-list>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import UserDAO from '@/dao/UserDAO'
import type User from '@/entity/User'
import { useRouter } from 'vue-router'

const users = ref<User[]>([])
const router = useRouter()

onMounted(async () => {
  users.value = await UserDAO.list()
})

const add = () => {
  router.push('/user/new')
}
</script>
