<template>
  <v-container :class="gridSize">
    <v-col>
      <v-sheet>
        <v-tabs ripple slider-color="yellow" v-model="tab">

          <v-tab key="1">
            Single Season
          </v-tab>
          <v-tab key="2">
            All Seasons
          </v-tab>
          <v-tab key="3">
            Head-to-head
          </v-tab>
        </v-tabs>
        <v-tabs-window v-model="tab">
          <v-tabs-window-item value="one">
            <v-container class="px-0" fluid>
              <v-sheet>
                <v-col>
                  <SeasonStats :teamId="id" />
                </v-col>
              </v-sheet>

            </v-container>
          </v-tabs-window-item>

          <v-tabs-window-item value="two">
            <v-container class="px-0" fluid>
              <v-sheet>
                <v-col>
                  <AllSeasonsStats :teamId="id" />
                </v-col>
              </v-sheet>

            </v-container>
          </v-tabs-window-item>

          <v-tabs-window-item value="three">
            <v-container class="px-0" fluid>
              <v-sheet>
                <v-col>
                  <HeadToHead :team-id="id" />
                </v-col>
              </v-sheet>
            </v-container>
          </v-tabs-window-item>
        </v-tabs-window>
      </v-sheet>
    </v-col>
  </v-container>
</template>
<script setup lang="ts">
import { useLayout } from '@/services/LayoutService';

import { ref } from 'vue';
import SeasonStats from './SeasonStats.vue';
import AllSeasonsStats from './AllSeasonsStats.vue';
import HeadToHead from './HeadToHead.vue';

defineProps<{ id: string }>()



const { gridSize } = useLayout()

const tab = ref()
</script>
