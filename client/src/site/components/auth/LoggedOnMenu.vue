<template>
  <v-menu offset-y v-if="user">
    <template v-slot:activator="{ props }">
      <v-btn fab v-bind="props" small :title="user.siteUser.handle">
        <slot></slot><v-avatar size="24" :image="user.siteUser.avatar" />
      </v-btn>
    </template>
    <v-list>
      <v-list-item to="/login/profile" key="1" prepend-icon="mdi-account" title="Edit Profile" />
      <v-list-item key="2" @click="logoff(user)" prepend-icon="mdi-logout" title="Logout" />
    </v-list>
  </v-menu>
</template>
<script setup lang="ts">
import type { LoggedInUser } from '@/services/AuthService';
import useAuth from '@/services/AuthService';

defineProps<{ user: LoggedInUser }>()

const { logout } = useAuth()

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const logoff = (_user: LoggedInUser) => {
  logout()
}

</script>
