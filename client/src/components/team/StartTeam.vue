<template>
  <v-container :class="gridSize" fluid>
    <v-col>
      <QlTextBox>
        <QlNamedText textName="start-team" />
      </QlTextBox>
    </v-col>
  </v-container>
</template>
<script setup lang="ts">

const { gridSize } = useLayout()

import { useLayout } from '@/services/LayoutService';
import QlNamedText from '../text/QlNamedText.vue';
import QlTextBox from '../text/QlTextBox.vue';

</script>
