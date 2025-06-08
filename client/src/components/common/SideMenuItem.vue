<template>
  <v-list-item :click="click" :to="to" :prepend-icon="icon" :title="title" color="blue" rounded="xl" />
</template>

<script setup lang="ts">

defineProps<{ to: string, icon?: string, title: string, click?: unknown }>()

</script>
