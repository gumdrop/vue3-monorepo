<template>
  <v-card class="match-report-item mb-4 elevation-1">
    <v-card-title class="report-header py-3 px-4">
      <div class="d-flex align-center">
        <v-icon color="primary" size="20" class="mr-2">mdi-account-edit-outline</v-icon>
        <span class="text-subtitle-1 font-weight-bold">
          Report by <ResponsiveTeamName v-if="team" :team="team" />
          <v-skeleton-loader v-else type="text" width="100" class="d-inline-block ml-1"></v-skeleton-loader>
        </span>
      </div>
    </v-card-title>
    <v-divider></v-divider>
    <v-card-text class="report-content pa-4">
      <QlText v-if="report.text" :id="report.text.id" />
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { useDocument } from 'vuefire'
import TeamDAO from '@/dao/TeamDAO'
import type { Report } from '@/entity/Fixtures'
import ResponsiveTeamName from '../common/ResponsiveTeamName.vue'
import QlText from '../text/QlText.vue'

const props = defineProps<{ report: Report }>()

const team = useDocument(() => TeamDAO.getById(props.report.team.id))
</script>

<style scoped>
.match-report-item {
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  overflow: hidden;
}

.report-header {
  background-color: #f8fafc;
  border-bottom: 1px solid #f1f5f9;
}

.report-content {
  font-size: 1rem;
  line-height: 1.6;
  color: #334155;
}

:deep(.html p) {
  margin-bottom: 1rem;
}

:deep(.html p:last-child) {
  margin-bottom: 0;
}
</style>
