<template>
  <tr v-if="standing.name">
    <td>{{ standing.name }}</td>
    <td> : </td>
    <td>{{ standing.standing }}</td>
  </tr>
  <tr v-else>
    <td colspan="3">{{ standing.standing }}</td>
  </tr>
</template>
<script setup lang="ts">
defineProps<{ standing: { name: string, standing: string } }>()

</script>
