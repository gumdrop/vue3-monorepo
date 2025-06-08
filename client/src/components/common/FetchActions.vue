<template>
  <v-btn-toggle v-model="fetchSize" mandatory selected-class="selected" variant="plain">
    <v-btn :value="1">Show 1</v-btn>
    <v-btn :value="5">Show 5</v-btn>
    <v-btn :value="Number.MAX_SAFE_INTEGER">Show All</v-btn>
  </v-btn-toggle>
</template>
<script setup lang="ts">
import { ref, watch } from 'vue';

const { initialFetch } = defineProps<{ initialFetch: number }>()

const emit = defineEmits<{ fetch: [value: number] }>()

const fetchSize = ref(initialFetch)

watch(fetchSize, (fetch) => {
  emit('fetch', fetch)
})
</script>
<style lang="css" scoped>
.selected {
  color: #03A9F4;
}
</style>
