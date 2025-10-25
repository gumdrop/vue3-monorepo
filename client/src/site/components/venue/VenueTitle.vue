<template>
  <SubTitle v-if="venue" colour="orange-lighten-3" :title="venue.name" />
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
