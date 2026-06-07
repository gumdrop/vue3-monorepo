<template><v-slide-y-transition>
    <v-card class="team-info-card elevation-2 overflow-hidden">
      <AliasContactDialog
        :open="contact"
        :team-id="teamId"
        :alias-text="team?.name"
        @close="contact = false"
      />
      <v-toolbar color="grey-lighten-4" density="compact" flat>
        <v-toolbar-title class="text-subtitle-2 font-weight-bold grey--text text--darken-2">
          Team Information
        </v-toolbar-title>
      </v-toolbar>
      
      <v-card-text v-if="team" class="pa-4">
        <div v-if="team.venue?.id" class="d-flex align-center mb-6">
          <v-icon color="primary" class="mr-3">mdi-map-marker-radius</v-icon>
          <div>
            <div class="text-caption text-uppercase font-weight-bold grey--text">Home Venue</div>
            <VenueLink :id="team.venue.id" class="text-subtitle-1 font-weight-medium text-primary text-decoration-none" />
          </div>
        </div>

        <div class="standings-section">
          <div class="d-flex align-center mb-3">
            <v-icon color="primary" class="mr-3">mdi-format-list-numbered</v-icon>
            <span class="text-subtitle-2 font-weight-bold grey--text text--darken-2">Current Standings</span>
          </div>
          <v-divider class="mb-4"></v-divider>
          <TeamStandings :team-id="teamId" />
        </div>
      </v-card-text>

      <v-divider></v-divider>
      
      <v-card-actions class="pa-4 flex-wrap ga-2">
        <v-btn
          variant="tonal"
          color="primary"
          prepend-icon="mdi-email"
          class="flex-grow-1"
          @click="contact = true"
        >
          Contact Us
        </v-btn>

        <v-btn 
          :to="`/team/${teamId}/stats`" 
          variant="tonal" 
          color="primary"
          prepend-icon="mdi-chart-bar"
          class="flex-grow-1"
        >
          Analytics
        </v-btn>
        
        <v-menu offset-y transition="slide-y-transition">
          <template v-slot:activator="{ props }">
            <v-btn 
              v-bind="props" 
              variant="tonal" 
              color="secondary"
              prepend-icon="mdi-calendar"
              class="flex-grow-1"
            >
              Calendar
            </v-btn>
          </template>
          <v-list density="comfortable" class="rounded-lg">
            <v-list-item v-on:click="copy(teamId)" prepend-icon="mdi-content-copy" title="Copy Calendar URL" />
            <v-list-item 
              :href="'calendar/team/' + teamId + '/calendar.ics'" 
              target="_blank" 
              prepend-icon="mdi-download"
              title="Download ICS File" 
            />
          </v-list>
        </v-menu>
      </v-card-actions>
    </v-card>
  </v-slide-y-transition>
</template>

<script setup lang="ts">
import TeamDAO from '@/dao/TeamDAO';
import { ref } from 'vue';
import { useDocument } from 'vuefire';
import AliasContactDialog from '../other/AliasContactDialog.vue';
import VenueLink from '../venue/VenueLink.vue';
import TeamStandings from './TeamStandings.vue';

const props = defineProps<{ teamId: string }>()

const contact = ref(false)
const team = useDocument(() => TeamDAO.getById(props.teamId))

const copy = (teamId: string) => {
  navigator.clipboard.writeText(`${document.location.origin}/calendar/team/${teamId}`)
}

</script>
<style scoped>
.team-info-card {
  border-radius: 16px !important;
  border: 1px solid #e2e8f0 !important;
}

.standings-section {
  background-color: #f8fafc;
  padding: 16px;
  border-radius: 12px;
  border: 1px solid #f1f5f9;
}
</style>
