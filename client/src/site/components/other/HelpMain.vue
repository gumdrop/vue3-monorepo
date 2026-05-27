<template>
  <v-container :class="gridSize" class="pa-0">
    <v-row no-gutters>
      <v-col cols="12" md="10" offset-md="1">
        <!-- Overview Section -->
        <v-card class="mb-6 elevation-2 help-card">
          <v-card-title class="bg-blue-lighten-5 py-3 px-4 d-flex align-center">
            <v-icon color="primary" start>mdi-information-outline</v-icon>
            <span class="text-h6 font-weight-bold primary--text">Overview</span>
          </v-card-title>
          <v-divider></v-divider>
          <v-card-text class="pa-6">
            <QlNamedText textName="help-content-main" />
          </v-card-text>
        </v-card>

        <!-- Login Section -->
        <v-card class="mb-6 elevation-2 help-card">
          <v-card-title class="bg-blue-lighten-5 py-3 px-4 d-flex align-center">
            <v-icon color="primary" start>mdi-login</v-icon>
            <span class="text-h6 font-weight-bold primary--text">Login</span>
          </v-card-title>
          <v-divider></v-divider>
          <v-card-text class="pa-6">
            <QlNamedText textName="help-content-login"></QlNamedText>
          </v-card-text>
        </v-card>

        <!-- Chat Section (User Only) -->
        <v-card v-if="user" class="mb-6 elevation-2 help-card">
          <v-card-title class="bg-blue-lighten-5 py-3 px-4 d-flex align-center">
            <v-icon color="primary" start>mdi-chat-processing-outline</v-icon>
            <span class="text-h6 font-weight-bold primary--text">Chat</span>
          </v-card-title>
          <v-divider></v-divider>
          <v-card-text class="pa-6">
            <QlNamedText textName="help-content-chat"></QlNamedText>
          </v-card-text>
        </v-card>

        <!-- Submitting Results Section -->
        <v-card class="mb-6 elevation-2 help-card">
          <v-card-title class="bg-blue-lighten-5 py-3 px-4 d-flex align-center">
            <v-icon color="primary" start>mdi-calendar-check</v-icon>
            <span class="text-h6 font-weight-bold primary--text">Submitting Results</span>
          </v-card-title>
          <v-divider></v-divider>
          <v-card-text class="pa-6">
            <QlNamedText textName="help-content-submit"></QlNamedText>
          </v-card-text>
        </v-card>

        <!-- Team Details Section (User Only) -->
        <v-card v-if="user" class="mb-6 elevation-2 help-card">
          <v-card-title class="bg-blue-lighten-5 py-3 px-4 d-flex align-center">
            <v-icon color="primary" start>mdi-account-details-outline</v-icon>
            <span class="text-h6 font-weight-bold primary--text">Team Details</span>
          </v-card-title>
          <v-divider></v-divider>
          <v-card-text class="pa-6">
            <QlNamedText textName="help-content-team"></QlNamedText>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>
<script setup lang="ts">
import { useLayout } from '@/services/LayoutService';
import { useSideMenuStore, useUserStore } from '@/stores/app';
import QlNamedText from '../text/QlNamedText.vue';

const { setSidemenu } = useSideMenuStore()

setSidemenu(true)
const { gridSize } = useLayout()

const { user } = useUserStore()

</script>
<style scoped>
.help-card {
  border-radius: 12px;
  overflow: hidden;
  transition: transform 0.2s ease;
}

.help-card:hover {
  transform: translateY(-2px);
}

.bg-blue-lighten-5 {
  background-color: #f0f7ff !important;
}

.pa-6 :deep(p) {
  margin-bottom: 1rem;
  line-height: 1.6;
  color: #334155;
}

.pa-6 :deep(p:last-child) {
  margin-bottom: 0;
}
</style>
