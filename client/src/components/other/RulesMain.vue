<template>
  <v-container :class="gridSize" fluid>
    <QlTitle title="Rules" />
    <v-col>
      <QlTextBox>
        <QlNamedText textName="rules-content"></QlNamedText>
      </QlTextBox>
    </v-col>
  </v-container>"
</template>
<script setup lang="ts">
import { useSideMenuStore } from '@/stores/app';
import QlNamedText from '../text/QlNamedText.vue'
import QlTextBox from '../text/QlTextBox.vue'
import QlTitle from '../common/PageTitle.vue';
import { useLayout } from '@/services/LayoutService';

const { setSidemenu } = useSideMenuStore()

setSidemenu(false)


const { gridSize } = useLayout()
</script>
