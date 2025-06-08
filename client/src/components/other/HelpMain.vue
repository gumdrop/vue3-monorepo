<template>
  <v-container :class="gridSize">
    <v-col>
      <QlTextBox>
        <h3 id="help-content-main">Overview</h3>
        <QlNamedText textName="help-content-main" />
      </QlTextBox>
    </v-col>
    <v-col>
      <QlTextBox>
        <h3 id="help-content-login">Login</h3>
        <QlNamedText textName="help-content-login"></QlNamedText>
      </QlTextBox>
    </v-col>
    <v-col v-if="user">
      <QlTextBox>
        <h3 id="help-content-chat">Chat</h3>
        <QlNamedText textName="help-content-chat"></QlNamedText>
      </QlTextBox>
    </v-col>
    <v-col>
      <QlTextBox>
        <h3 id="help-content-submit">Submitting Results</h3>
        <QlNamedText textName="help-content-submit"></QlNamedText>
      </QlTextBox>
    </v-col>
    <v-col v-if="user">
      <QlTextBox>
        <h3 id="help-content-team">Team Details</h3>
        <QlNamedText textName="help-content-team"></QlNamedText>
      </QlTextBox>
    </v-col>
  </v-container>
</template>
<script setup lang="ts">
import { useLayout } from '@/services/LayoutService';
import { useSideMenuStore, useUserStore } from '@/stores/app';
import QlNamedText from '../text/QlNamedText.vue';
import QlTextBox from '../text/QlTextBox.vue';

const { setSidemenu } = useSideMenuStore()

setSidemenu(true)
const { gridSize } = useLayout()

const { user } = useUserStore()

</script>
