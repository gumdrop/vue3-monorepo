<template>
  <v-container :class="gridSize" fluid>

    <v-col>
      <QlTextBox>
        <QlNamedText textName="links-content" />
      </QlTextBox>
    </v-col>

  </v-container>
</template>
<script setup lang="ts">
import { useSideMenuStore } from '@/stores/app';
import QlNamedText from '../text/QlNamedText.vue'
import QlTextBox from '../text/QlTextBox.vue'
import { useLayout } from '@/services/LayoutService';
const {gridSize} = useLayout()

const { setSidemenu } = useSideMenuStore()

setSidemenu(false)

</script>
