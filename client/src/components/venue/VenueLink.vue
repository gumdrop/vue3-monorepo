<template>
  <RouterLink v-if="venue" :to="`/venue/${id}`">{{ venue.name }}</RouterLink>
</template>
<script setup lang="ts">
import VenueDAO from '@/dao/VenueDAO';
import { useDocument } from 'vuefire';

const { id } = defineProps<{ id: string }>()
const venue = useDocument(() => VenueDAO.getById(id))
</script>
