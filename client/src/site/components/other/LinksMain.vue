<template>
  <v-container :class="gridSize" fluid class="pa-0">
    <v-row no-gutters>
      <v-col cols="12">
        <div class="content-wrapper">
          <QlTextBox>
            <QlNamedText textName="links-content" />
          </QlTextBox>
        </div>
      </v-col>
    </v-row>
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
<style scoped>
.content-wrapper {
  background-color: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}
</style>
