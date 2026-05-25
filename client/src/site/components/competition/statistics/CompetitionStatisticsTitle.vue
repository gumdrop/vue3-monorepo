<template>
  <SubTitle
    v-if="statistics"
    colour="purple-lighten-3"
    :title="`Roll Of Honour - ${statistics.competitionName}`"
  />
</template>

<script setup lang="ts">
import SubTitle from '@/site/components/common/SubTitle.vue'
import { toRef } from 'vue'
import { useCompetitionStatisticsEntry } from './useCompetitionStatisticsEntry'

const props = defineProps<{
  id: string
}>()

const { statistics } = useCompetitionStatisticsEntry(toRef(props, 'id'))
</script>
