<template>
  <SubTitle v-if="venue" :title="venue.name" icon="mdi-office-building-marker" colour="orange-lighten-3" />
</template>
<script setup lang="ts">
import VenueDAO from '@/dao/VenueDAO';
import { useDocument } from 'vuefire';
import SubTitle from '../common/SubTitle.vue';

const props = defineProps<{
  id: string
}>()

const venue = useDocument(() => VenueDAO.getById(props.id))

</script>
