<template>
  <SubTitle colour="amber-lighten-3" :title="`${team.name} : Graphs and Statistics`" v-if="team" />
</template>
<script setup lang="ts">
import SubTitle from '@/components/common/SubTitle.vue';
import TeamDAO from '@/dao/TeamDAO';
import { useDocument } from 'vuefire';

const props = defineProps<{
  id: string
}>()

const team = useDocument(() => TeamDAO.getById(props.id))

</script>
