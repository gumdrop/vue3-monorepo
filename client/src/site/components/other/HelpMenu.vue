<template>
  <SideMenu title="Help" icon="mdi-help">
    <v-list-item @click="goTo('#help-content-main')" title="Overview" color="blue" rounded="xl">
    </v-list-item>
    <v-list-item @click="goTo('#help-content-login')" title="Login" color="blue" rounded="xl">
    </v-list-item>
    <v-list-item v-if="user" @click="goTo('#help-content-chat')" title="Chat" color="blue" rounded="xl">
    </v-list-item>
    <v-list-item @click="goTo('#help-content-submit')" title="Submitting Results" color="blue" rounded="xl">
    </v-list-item>
    <v-list-item v-if="user" @click="goTo('#help-content-team')" title="Team Details" color="blue" rounded="xl">
    </v-list-item>
  </SideMenu>
</template>
<script setup lang="ts">
import { useGoTo } from 'vuetify'

import { useUserStore } from '@/stores/app'
import SideMenu from '@/site/components/common/SideMenu.vue';
import { storeToRefs } from 'pinia';

const { user } = storeToRefs(useUserStore())

const goTo = useGoTo()

</script>
