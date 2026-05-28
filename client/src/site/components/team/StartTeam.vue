<template>
  <v-container :class="gridSize" fluid class="pa-0">
    <v-row no-gutters>
      <v-col cols="12">
        <div class="content-wrapper">
          <QlTextBox>
            <QlNamedText textName="start-team" />
          </QlTextBox>
        </div>
      </v-col>
    </v-row>
  </v-container>
</template>
<script setup lang="ts">
import { useLayout } from '@/services/LayoutService';
import QlNamedText from '../text/QlNamedText.vue';
import QlTextBox from '../text/QlTextBox.vue';

const { gridSize } = useLayout()
</script>
<style scoped>
.content-wrapper {
  background-color: white;
  border-radius: 12px;
  overflow: hidden;
}
</style>
