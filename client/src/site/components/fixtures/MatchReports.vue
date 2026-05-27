<template>
  <div v-if="reports && reports.length > 0" class="match-reports-container pa-4">
    <div v-for="report in reports" :key="report.id">
      <MatchReportItem :report="report" />
    </div>
  </div>
  <div v-else-if="reports && reports.length === 0" class="no-reports-message pa-8 text-center">
    <v-icon size="48" color="grey-lighten-1" class="mb-2">mdi-note-off-outline</v-icon>
    <div class="text-body-1 text-grey-darken-1">No match reports available yet.</div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { reportDAO } from '@/dao/FixturesDAO'
import { useCollection } from 'vuefire'
import MatchReportItem from './MatchReportItem.vue'

const props = defineProps<{ keyval: string }>()

const reportsDoc = computed(() => reportDAO.subCollection(props.keyval))
const reports = useCollection(reportsDoc)
</script>

<style scoped>
.match-reports-container {
  background-color: white;
}

.no-reports-message {
  background-color: #fafafa;
  border-radius: 8px;
}
</style>
