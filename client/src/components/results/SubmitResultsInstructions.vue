<template>
  <v-container :class="gridSize" fluid>
    <v-col>
      <QlTextBox>
        <QlNamedText textName="submit-results-instructions" />
      </QlTextBox>
    </v-col>
  </v-container>
</template>
<script setup lang="ts">
import { useLayout } from '@/services/LayoutService';
import QlTextBox from '../text/QlTextBox.vue';
import QlNamedText from '../text/QlNamedText.vue';

const { gridSize } = useLayout()

</script>
