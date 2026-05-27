<template>
  <v-container :class="gridSize" v-if="item" fluid class="pa-0">
    <v-row>
      <v-col cols="12">
        <div class="content-wrapper mb-6">
          <QlTextBox>
            <QlNamedText :textName="itemTextName"></QlNamedText>
          </QlTextBox>
        </div>
      </v-col>
      <v-col cols="12">
        <v-card class="event-details-card elevation-2">
          <v-toolbar color="primary" density="compact" flat>
            <v-icon color="white" start class="ml-4">mdi-information-outline</v-icon>
            <v-toolbar-title class="text-subtitle-1 font-weight-bold white--text">Competition Details</v-toolbar-title>
          </v-toolbar>
          <v-card-text class="pa-6">
            <div v-if="event" class="event-info mb-6">
              <div class="d-flex align-center mb-4">
                <v-icon color="primary" class="mr-3">mdi-map-marker-radius</v-icon>
                <div>
                  <div class="text-caption text-uppercase font-weight-bold grey--text">Venue</div>
                  <VenueLink v-if="event.venue" :id="event.venue.id" class="text-subtitle-1 font-weight-medium text-primary text-decoration-none" />
                </div>
              </div>
              <div class="d-flex align-center">
                <v-icon color="primary" class="mr-3">mdi-calendar-clock</v-icon>
                <div>
                  <div class="text-caption text-uppercase font-weight-bold grey--text">Date & Time</div>
                  <div class="text-subtitle-1 font-weight-medium">
                    {{ date(event.date, 'd MMMM yyyy') }} starting at {{ event.time }}
                  </div>
                </div>
              </div>
            </div>
            
            <v-divider v-if="item.text" class="mb-6"></v-divider>
            
            <div v-if="item.text" class="additional-info">
              <QlText :id="item.text.id" />
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>
<script setup lang="ts">
import CompetitionDAO from '@/dao/CompetitionDAO'
import { useKey } from '@/services/KeyService'
import { computed } from 'vue'
import { useDocument } from 'vuefire'
import QlNamedText from '../text/QlNamedText.vue'
import QlText from '../text/QlText.vue'
import QlTextBox from '../text/QlTextBox.vue'
import { useDateTime } from '@/services/DateService'
import { useLayout } from '@/services/LayoutService'
import VenueLink from '../venue/VenueLink.vue'
const { gridSize } = useLayout()

const { decode } = useKey()
const { date } = useDateTime()

const props = defineProps<{ path: string }>()
const path = computed(() => decode(props.path))
const item = useDocument(() => CompetitionDAO.getByPath(path.value))
type CompetitionEvent = { date: string; time: string; venue?: { id: string } }

const itemTextName = computed<string>(() => {
  const competition = item.value as { textName?: string; text?: { id: string } } | undefined
  return competition?.textName ?? competition?.text?.id ?? ''
})
const event = computed<CompetitionEvent | undefined>(() => {
  const competition = item.value as { event?: CompetitionEvent } | undefined
  return competition?.event
})
</script>
<style scoped>
.content-wrapper {
  background-color: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.event-details-card {
  border-radius: 16px !important;
  overflow: hidden;
}

.event-info {
  background-color: #f8fafc;
  padding: 20px;
  border-radius: 12px;
  border: 1px solid #f1f5f9;
}
</style>
