<script setup lang="ts">
import QlNamedText from '../text/QlNamedText.vue';
import QlTextBox from '../text/QlTextBox.vue';

const gridSize = {}

</script>

<template>
  <v-container v-bind="gridSize" fluid>

    <v-col>
      <QlTextBox>
        <QlNamedText textName="competitions-header"></QlNamedText>
      </QlTextBox>
    </v-col>

  </v-container>
</template>
