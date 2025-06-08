<template>
  <SideMenu title="Help" icon="mdi-help">
    <v-list-item @click="goTo('#help-content-main')" title="Overview" active-color="blue" rounded="xl">
    </v-list-item>
    <v-list-item @click="goTo('#help-content-login')" title="Login" active-color="blue" rounded="xl">
    </v-list-item>
    <v-list-item v-if="user" @click="goTo('#help-content-chat')" title="Chat" active-color="blue" rounded="xl">
    </v-list-item>
    <v-list-item @click="goTo('#help-content-submit')" title="Submitting Results" active-color="blue" rounded="xl">
    </v-list-item>
    <v-list-item v-if="user" @click="goTo('#help-content-team')" title="Team Details" active-color="blue" rounded="xl">
    </v-list-item>
  </SideMenu>
</template>
<script setup lang="ts">
import { useGoTo } from 'vuetify'

import { useUserStore } from '@/stores/app'
import SideMenu from '@/components/common/SideMenu.vue';

const { user } = useUserStore()

const goTo = useGoTo()

</script>
