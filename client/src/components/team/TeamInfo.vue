<template><v-slide-y-transition>
    <v-card title="Team Info">
      <v-card-text v-if="team">
        Venue :&nbsp;
        <VenueLink :id="team.venue.id" />
      </v-card-text>

      <v-card-subtitle>Standings</v-card-subtitle>
      <v-card-text>
        <TeamStandings :team-id="teamId" />
      </v-card-text>
      <v-card-actions>
        <v-btn :to="`/team/${teamId}/stats`" prepend-icon="mdi-chart-bar">Graphs and Stats</v-btn>
        <v-menu offset-y>
          <template v-slot:activator="{ props }">
            <v-btn v-bind="props" prepend-icon="mdi-calendar">Calendar</v-btn>
          </template>
          <v-list>
            <v-list-item v-on:click="copy(teamId)" prepend-icon="mdi-content-copy" title="Copy Calendar URL" />
            <v-list-item :href="'calendar/team/' + teamId + '/calendar.ics'" target="_blank" prepend-icon="mdi-download"
              title="Download Calendar File" />
          </v-list>

        </v-menu>
      </v-card-actions>
    </v-card>
  </v-slide-y-transition>
</template>

<script setup lang="ts">
import TeamDAO from '@/dao/TeamDAO';
import { useDocument } from 'vuefire';
import VenueLink from '../venue/VenueLink.vue';
import TeamStandings from './TeamStandings.vue';

const props = defineProps<{ teamId: string }>()

const team = useDocument(() => TeamDAO.getById(props.teamId))

const copy = (teamId: string) => new Clipboard().writeText(`${document.location.origin}/calendar/team/${teamId}`)

</script>
