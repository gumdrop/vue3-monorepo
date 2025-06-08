<script setup lang="ts">
import QlTitle from './PageTitle.vue';

defineProps<{ title: string, colour: string }>()

</script>

<template>
  <v-toolbar :color="colour" class="subtitle-background" elevation="3" density="compact">
    <QlTitle :title="title" />
    <v-toolbar-title>
      {{ title }}
    </v-toolbar-title>
  </v-toolbar>
</template>
<style lang="css" scoped>
.subtitle-background {
  background-image: linear-gradient(to top right, rgba(255, 255, 255, 0.7), rgba(255, 255, 255, 0));
}
</style>
