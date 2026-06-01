<template>
  <v-container :class="gridSize" fluid class="pa-0">
    <v-row no-gutters>
      <v-col cols="12">
        <div class="content-wrapper mb-6">
          <QlTextBox>
            <QlNamedText textName="teams-header"></QlNamedText>
          </QlTextBox>
        </div>
        
        <v-slide-y-transition>
          <div v-if="$vuetify.display.smAndDown && teams" class="mobile-teams-list">
            <v-card elevation="2" class="rounded-xl overflow-hidden">
              <v-card-title class="bg-grey-lighten-4 py-3 px-4">
                <span class="text-subtitle-1 font-weight-bold">Registered Teams</span>
              </v-card-title>
              <v-divider></v-divider>
              <v-list density="comfortable">
                <v-list-item 
                  v-for="team in teams" 
                  :key="team.id" 
                  :to="`/team/${team.id}`"
                >
                  <template v-slot:prepend>
                    <v-icon color="primary">mdi-shield-outline</v-icon>
                  </template>
                  <v-list-item-title class="font-weight-medium">{{ team.name }}</v-list-item-title>
                  <template v-slot:append>
                    <v-icon size="small">mdi-chevron-right</v-icon>
                  </template>
                </v-list-item>
              </v-list>
            </v-card>
          </div>
        </v-slide-y-transition>
      </v-col>
    </v-row>
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

<style scoped>
.content-wrapper {
  background-color: white;
  border-radius: 12px;
  overflow: hidden;
}

.mobile-teams-list {
  border-radius: 16px;
}
</style>
