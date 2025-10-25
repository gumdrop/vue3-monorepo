<template>
  <v-list v-model:opened="open" density="compact">
    <v-list-group :value="title">
      <template v-slot:activator="{ props }">
        <v-list-item v-bind="props" :prepend-icon="icon" :title="title" density="compact" :active="true" active-color="blue"></v-list-item>
      </template>
      <slot></slot>
    </v-list-group>
  </v-list>
</template>
<script setup lang="ts">
import { ref, watch } from 'vue';


const props = defineProps<{ title: string, icon: string }>()
const open = ref<string[]>()

watch(() => props.title, (title) => {
  open.value = [title]
}, { immediate: true })


</script>
