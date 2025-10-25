<template>
  <v-container :class="gridSize" fluid>
    <v-col>
      <QlTextBox>
        <QlNamedText textName="teams-header"></QlNamedText>
      </QlTextBox>
      <v-list v-if="$vuetify.display.smAndDown && teams">
        <v-list-item v-for="team in teams" :key="team.id" :to="`/team/${team.id}`" :title="team.name" />
      </v-list>
    </v-col>
  </v-container>
</template>

<script setup lang="ts">
import TeamDAO from '@/dao/TeamDAO';
import { useLayout } from '@/services/LayoutService';
import { useCollection } from 'vuefire';
import QlTextBox from '../text/QlTextBox.vue';
import QlNamedText from '../text/QlNamedText.vue';
const { gridSize } = useLayout()


const teams = useCollection(() => TeamDAO.sortedActive("name"))
</script>
