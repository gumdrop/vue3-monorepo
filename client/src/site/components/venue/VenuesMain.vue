<template>
  <v-container fluid class="pa-0" :class="gridSize">
    <v-row no-gutters>
      <v-col cols="12">
        <div class="content-wrapper">
          <QlTextBox>
            <QlNamedText textName="venues-front-page"></QlNamedText>
          </QlTextBox>
        </div>
        
        <div v-if="smAndDown" class="mt-6">
          <v-card elevation="2" class="venues-mobile-list">
            <v-card-title class="bg-grey-lighten-4 py-3">
              <span class="text-subtitle-1 font-weight-bold">Available Venues</span>
            </v-card-title>
            <v-divider></v-divider>
            <v-list density="comfortable">
              <v-list-item :to="'/venue/' + venue.id" v-for="venue in venues" :key="venue.id">
                <template v-slot:prepend>
                  <v-icon color="primary">mdi-map-marker-outline</v-icon>
                </template>
                <v-list-item-title class="font-weight-medium">{{ venue.name }}</v-list-item-title>
                <template v-slot:append>
                  <v-icon size="small">mdi-chevron-right</v-icon>
                </template>
              </v-list-item>
            </v-list>
          </v-card>
        </div>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import VenueDAO from '@/dao/VenueDAO';
import { useCollection } from 'vuefire';
import { useDisplay } from 'vuetify';
import QlNamedText from '@/site/components/text/QlNamedText.vue'
import QlTextBox from '../text/QlTextBox.vue';
import { useLayout } from '@/services/LayoutService';

const { gridSize } = useLayout()

const venues = useCollection(() => VenueDAO.sortedActive("name"))

const { smAndDown } = useDisplay()

</script>

<style scoped>
.content-wrapper {
  background-color: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.venues-mobile-list {
  border-radius: 12px;
  overflow: hidden;
}
</style>
