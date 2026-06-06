<template>
  <v-btn v-if="resultsSummaryDoc" variant="text" size="small" @click="showSummary = true">Roundup</v-btn>
  <v-dialog v-model="showSummary" max-width="600">
    <v-card>
      <v-card-title>Roundup for {{ date(fixtures.date, 'd MMM yyyy') }} {{ parentName }} {{ fixtures.description }}</v-card-title>
      <v-card-text>
        <QlText v-if="resultsSummaryDoc" :id="resultsSummaryDoc.id" />
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="primary" @click="showSummary = false">Close</v-btn>
      </v-card-actions>
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
