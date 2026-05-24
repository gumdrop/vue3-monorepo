<template>
  <v-card>
    <v-card-title>{{ title }}</v-card-title>
    <v-card-text>
      <v-container fluid v-if="data">
        <v-row justify="center">
          <Line
            :width="$vuetify.display.smAndDown ? '300px' : '450px'"
            height="300px"
            type="line"
            :data="data"
            :options="{
              ...defaultOptions,
              ...options,
            }"
          />
        </v-row>
      </v-container>
    </v-card-text>
  </v-card>
</template>
<script setup lang="ts">
import type Statistics from '@/entity/Statisitics'
import { usePromise } from '@/utils/PromiseRef'
import type { ChartData, ChartOptions, Point } from 'chart.js/auto'
import { Line } from 'vue-chartjs'

type dataType = ChartData<'line', (number | Point | null)[], unknown>

const props = defineProps<{
  stats: Statistics[][]
  dataFn: (stats: Statistics[][]) => Promise<dataType>
  title: string
  options?: ChartOptions<'line'>
}>()

const data = usePromise(() => props.dataFn(props.stats))

const defaultOptions: ChartOptions<'line'> = {
  maintainAspectRatio: false,
  responsive: false,
  scales: {
    y: { type: 'linear' },
  },
  plugins: { legend: { display: true, position: 'right' } },
}
</script>
