<template>
  <SubTitle v-if="team" :title="team.name" icon="mdi-shield-outline" colour="amber-lighten-3" />
</template>
<script setup lang="ts">
import TeamDAO from '@/dao/TeamDAO';
import { useDocument } from 'vuefire';
import SubTitle from '../common/SubTitle.vue';

const props = defineProps<{
  id: string
}>()

const team = useDocument(() => TeamDAO.getById(props.id))

</script>
