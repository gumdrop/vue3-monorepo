<template>
  <v-container :class="gridSize" fluid class="pa-0">
    <v-row no-gutters>
      <v-col cols="12">
        <QlTextBox>
          <QlNamedText textName="rules-content"></QlNamedText>
        </QlTextBox>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { useSideMenuStore } from '@/stores/app';
import QlNamedText from '../text/QlNamedText.vue'
import QlTextBox from '../text/QlTextBox.vue'
import { useLayout } from '@/services/LayoutService';

const { setSidemenu } = useSideMenuStore()

setSidemenu(false)


const { gridSize } = useLayout()
</script>
