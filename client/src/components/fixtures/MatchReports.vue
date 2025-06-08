<template>
  <v-container grid-list-sm v-if="reports">
    <v-col v-for="report in reports" :key="report.id">
      <v-card>
        <v-card-title>
          <h5>{{ report.team.name }}</h5>
        </v-card-title>
        <v-card-text v-if="report.text">
          <QlText :id="report.text.id" />
        </v-card-text>
      </v-card>
    </v-col>
  </v-container>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import QlText from '../text/QlText.vue';
import { reportDAO } from '@/dao/FixturesDAO';
import { useCollection } from 'vuefire';
const props = defineProps<{ keyval: string }>()

const reportsDoc = computed(() => reportDAO.subCollection(props.keyval))
const reports = useCollection(reportsDoc)

</script>
