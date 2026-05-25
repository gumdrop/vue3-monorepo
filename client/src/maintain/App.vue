<template>
  <v-app>
    <v-app-bar color="primary" density="compact">
      <v-app-bar-nav-icon @click="drawer = !drawer"></v-app-bar-nav-icon>
      <v-toolbar-title>Chiltern Quiz League Maintenance</v-toolbar-title>
      <v-spacer></v-spacer>
      <v-btn to="/" icon="mdi-home"></v-btn>
    </v-app-bar>

    <v-navigation-drawer v-model="drawer">
      <v-list>
        <v-list-item v-for="item in menuItems" :key="item.title" :to="item.to" :prepend-icon="item.icon" :title="item.title" link>
        </v-list-item>
      </v-list>
    </v-navigation-drawer>

    <v-main>
      <router-view></router-view>
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const drawer = ref(true)

const menuItems = [
  { title: 'Seasons', to: '/season', icon: 'mdi-calendar' },
  { title: 'Teams', to: '/team', icon: 'mdi-account-multiple' },
  { title: 'Venues', to: '/venue', icon: 'mdi-map-marker' },
  { title: 'Users', to: '/user', icon: 'mdi-account' },
  { title: 'Site Users', to: '/siteuser', icon: 'mdi-account-circle' },
  { title: 'Global Text', to: '/globaltext', icon: 'mdi-text' },
  { title: 'Competition Statistics', to: '/competitionstatistics', icon: 'mdi-chart-line' },
  { title: 'Application Context', to: '/applicationcontext', icon: 'mdi-cog' },
]
</script>
