<template>
  <QlSideMenu title="Venues" icon="mdi-map-marker" v-if="venues">
    <SideMenuItem :to="'/venue/' + venue.id" v-for="venue in venues" :key="venue.id" :title="venue.name" />
  </QlSideMenu>
</template>
<script setup lang="ts">
import VenueDAO from '@/dao/VenueDAO';
import { useCollection } from 'vuefire';
import QlSideMenu from '../common/SideMenu.vue';
import { useSideMenuStore } from '@/stores/app';
import SideMenuItem from '../common/SideMenuItem.vue';
const { setSidemenu } = useSideMenuStore()

setSidemenu(true)

const venues = useCollection(() => VenueDAO.sortedActive("name"))

</script>
