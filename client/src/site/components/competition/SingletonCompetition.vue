<template>
  <v-container :class="gridSize" v-if="item" fluid>
    <v-col align-content-start>
      <QlTextBox>
        <QlNamedText :textName="itemTextName"></QlNamedText>
      </QlTextBox>
    </v-col>
    <v-col>
      <v-card>
        <v-card-text>
          <div v-if="event">
            <b
              >This season's competition will take place at
              <VenueLink v-if="event.venue" :id="event.venue.id" />
              on {{ date(event.date, 'd MMMM yyyy') }} starting at {{ event.time }}</b
            >
          </div>
          <br />
          <QlText :id="item.text.id" v-if="item.text" />
        </v-card-text>
      </v-card>
    </v-col>
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
