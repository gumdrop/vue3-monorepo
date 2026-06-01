<template>
  <SideMenu title="Results" icon="mdi-check">
    <SideMenuItem to="/results/all" title="All Results" />

    <SideMenuItem to="/results/questions" title="Questions" />

    <SideMenuItem to="/fixtures/all" title="All Fixtures" />

    <SideMenuItem to="/results/submit" v-if="user" title="Submit Results" />

    <SideMenuItem to="/results/submit/instructions" v-if="!user" title="Submit Results" />

  </SideMenu>
</template>
<script setup lang="ts">
import { useSideMenuStore, useUserStore } from '@/stores/app';
import { storeToRefs } from 'pinia';
import SideMenu from '../common/SideMenu.vue';
import SideMenuItem from '../common/SideMenuItem.vue';

const { setSidemenu } = useSideMenuStore()
setSidemenu(true)

const { user } = storeToRefs(useUserStore())


</script>
