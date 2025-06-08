<template>
  <v-card>
    <v-card-title>Upcoming Events</v-card-title>
    <v-card-text v-if="events">
      <v-container>
        <v-row v-for="event in events" :key="event.date" style="margin-bottom:1em;">
          <v-col>
            <v-row v-if="event.competition">
              <h4>
                <CompetitionLink :path="event.competition.path" />
                : {{ date(event.date, "d MMMM yyyy") }} {{ event.time }}
              </h4>
            </v-row>
            <v-row v-else>
              <h4>{{ event.description }} : {{ date(event.date, "d MMMM yyyy") }}
                {{ event.time }}</h4>
            </v-row>
            <v-row v-if="event.venue">Venue :&nbsp;
              <VenueLink :id="event.venue.id" />
            </v-row>
          </v-col>

        </v-row>
      </v-container>
    </v-card-text>
  </v-card>
</template>
<script setup lang="ts">
import { useCalendar } from '@/services/CalendarService';
import { useDateTime } from '@/services/DateService';
import { usePromise } from '@/utils/PromiseRef';
import CompetitionLink from '../competition/CompetitionLink.vue';
import VenueLink from '../venue/VenueLink.vue';


const { date } = useDateTime()
const { seasonId } = defineProps<{ seasonId: string }>()
const { standaloneEvents } = useCalendar()

const events = usePromise(() => standaloneEvents(seasonId))


</script>
