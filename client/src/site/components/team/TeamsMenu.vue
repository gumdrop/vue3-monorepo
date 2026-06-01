<template>
  <SideMenu title="Teams" icon="mdi-account-multiple" v-if="teams">
    <SideMenuItem to="/team/start" title="Start a team" />
    <SideMenuItem v-if="user" to="/team/edit" title="Edit Team Details" />
    <v-divider></v-divider>
    <SideMenuItem :to="'/team/' + team.id" v-for="team in teams " :key="team.id" :title="team.name" />
  </SideMenu>
</template>
<script setup lang="ts">
import TeamDAO from '@/dao/TeamDAO';
import { useCollection } from 'vuefire';
import SideMenu from '../common/SideMenu.vue';
import { useSideMenuStore, useUserStore } from '@/stores/app';
import SideMenuItem from '../common/SideMenuItem.vue';
import { storeToRefs } from 'pinia';
const { setSidemenu } = useSideMenuStore()

setSidemenu(true)

const teams = useCollection(() => TeamDAO.sortedActive("name"))

const { user } = storeToRefs(useUserStore())

</script>
