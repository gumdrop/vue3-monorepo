<template>
  <v-card>
    <v-card-title>{{ title }}</v-card-title>
    <v-card-text>
      <v-container fluid v-if="data">
        <v-row justify="center">
          <Line :width="$vuetify.display.smAndDown ? '300px' : '450px'" height="300px" type="line" :data="data"
            :options="{
              ...defaultOptions, ...options,
            }" />
        </v-row>
      </v-container>
    </v-card-text>
  </v-card>
</template>
<script setup lang="ts">
import Statistics from '@/entity/Statisitics';
import { usePromise } from '@/utils/PromiseRef';
import type { ChartData, DatasetChartOptions, ElementChartOptions, ElementOptionsByType, PluginChartOptions, PluginOptionsByType, Point, ScaleChartOptions } from 'chart.js/auto';
import { Line } from 'vue-chartjs';

type optionsType = ElementOptionsByType<"line"> & PluginOptionsByType<"line"> & ElementChartOptions<"line"> & PluginChartOptions<"line"> & DatasetChartOptions<"line"> & ScaleChartOptions<"line">
type dataType = ChartData<"line", (number | Point | null)[], unknown>

const props = defineProps<{
  stats: Statistics[][],
  dataFn: (stats: Statistics[][]) => Promise<dataType>,
  title: string,
  options?: optionsType
}>()

const data = usePromise(() => props.dataFn(props.stats))

const defaultOptions = {
  maintainAspectRatio: false,
  responsive: false,
  scales: {
    y: { type: 'linear' }
  },
  plugins: { legend: { display: true, position: 'right' } }
}

</script>
