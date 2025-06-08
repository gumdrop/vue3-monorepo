<template>
  <h6 v-if="$vuetify.display.smAndDown" :class="classes">
    <slot></slot>
  </h6>
  <h3 class="headline mb-0" :class="classes" v-else>
    <slot></slot>
  </h3>
</template>
<script setup lang="ts">
defineProps<{ classes?: string }>()
</script>
