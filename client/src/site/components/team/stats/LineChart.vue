<template>
  <v-card>
    <v-card-title>{{ title }}</v-card-title>
    <v-card-text>
      <v-container fluid>
        <Line :width="$vuetify.display.smAndDown ? '300px' : '400px'" height="300px" v-if="stats" type="line"
          :data="data" :options="{ ...defaultOptions, ...options }" />
      </v-container>
    </v-card-text>
  </v-card>
</template>
<script setup lang="ts">
import Statistics from '@/entity/Statisitics';
import 'chart.js/auto';
import type { ChartData, DatasetChartOptions, ElementChartOptions, PluginChartOptions, Point, ScaleChartOptions } from 'chart.js/auto';
import { computed } from 'vue';
import { Line } from 'vue-chartjs';

type optionsType = ElementChartOptions<"line"> & PluginChartOptions<"line"> & DatasetChartOptions<"line"> & ScaleChartOptions<"line">
type dataType = ChartData<"line", (number | Point | null)[], unknown>

const props = defineProps<{
  stats: Statistics,
  title: string,
  options?: optionsType,
  dataFn: (stats: Statistics) => dataType
}>()

const data = computed(() => props.dataFn(props.stats))

const defaultOptions = {
  maintainAspectRatio: false,
  responsive: false,
  scales: {
    y: { type: 'linear' }
  }
}

</script>
