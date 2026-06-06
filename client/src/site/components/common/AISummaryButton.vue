<template>
  <v-btn v-if="resultsSummaryDoc" variant="text" size="small" @click="showSummary = true">Roundup</v-btn>
  <v-dialog v-model="showSummary" max-width="600">
    <v-card class="rounded-xl overflow-hidden">
      <v-toolbar color="primary" density="compact" flat>
        <v-toolbar-title class="text-subtitle-1 font-weight-bold d-flex align-center">
          <v-icon start class="mr-2">mdi-clipboard-text-outline</v-icon>
          <span>Roundup</span>
        </v-toolbar-title>
        <v-spacer></v-spacer>
        <v-btn icon @click="showSummary = false">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-toolbar>
      <v-card-text class="pa-6">
        <div class="text-subtitle-1 font-weight-bold mb-4 text-grey-darken-2">
          {{ date(fixtures.date, 'd MMM yyyy') }}{{ parentName ? ` - ${parentName}` : '' }}{{ fixtures.description ? ` (${fixtures.description})` : '' }}
        </div>
        <QlText v-if="resultsSummaryDoc" :id="resultsSummaryDoc.id" />
      </v-card-text>
    </v-card>
  </v-dialog>
</template>
<script setup lang="ts">
import { ref, computed } from 'vue';
import type Fixtures from '@/entity/Fixtures';
import { useDateTime } from '@/services/DateService';
import QlText from '@/site/components/text/QlText.vue';

const { date } = useDateTime()

const props = defineProps<{ fixtures: Fixtures, parentName?: string }>();

const showSummary = ref(false);
const resultsSummaryDoc = computed(() => props.fixtures?.resultsSummary);
</script>
