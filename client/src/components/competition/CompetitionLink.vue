<template>
  <RouterLink v-if="competition" :to="`/${encoded}/${competition._name}`"><v-icon>{{
                  competition.icon }}</v-icon>&nbsp;{{ competition.name }}</RouterLink>
</template>
<script setup lang="ts">
import CompetitionDAO from '@/dao/CompetitionDAO';
import { useKey } from '@/services/KeyService';
import { computed } from 'vue';
import { useDocument } from 'vuefire';

const props = defineProps<{path:string}>()
const {encode} = useKey()

const encoded = computed(() => encode(props.path))
const competition = useDocument(() => CompetitionDAO.getByPath(props.path))
</script>
