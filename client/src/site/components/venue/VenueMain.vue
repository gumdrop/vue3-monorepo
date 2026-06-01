<template>
  <v-container fluid v-if="venue" :class="gridSize">
    <v-col>
      <v-card elevation="5">
        <v-card-text>
          <v-container grid-list-sm fluid>
            <v-row wrap justify-end>
              <v-col>
                <div>
                  <div>Address :</div>
                  <div class="pl-2" v-html="lineBreaks(venue.address)"></div>
                  <div v-if="$vuetify.display.mdAndUp">
                    <p></p>
                    <iframe
                      :src="embeddedUrl(venue)"
                      width="400"
                      height="300"
                      frameborder="0"
                      style="border: 0"
                    ></iframe>
                  </div>
                  <div v-if="$vuetify.display.smAndDown">
                    <a :href="linkUrl(venue)" target="_blank">map</a>
                  </div>
                </div>
                <div>
                  <div>
                    email : <a :href="'mailto:' + venue.email">{{ venue.email }}</a>
                  </div>
                  <div>
                    website : <a :href="venue.website" target="_blank">{{ venue.website }}</a>
                  </div>
                  <div>phone : {{ venue.phone }}</div>
                </div>
              </v-col>
              <v-col
                v-if="venue.imageURL"
                class="hidden-xs-only text-xs-left text-sm-left text-md-right text-lg-right text-xl-right"
              >
                <img :src="venue.imageURL" style="max-width: 275px; max-height: 200px" />
              </v-col>
            </v-row>
          </v-container>
        </v-card-text>
      </v-card>
    </v-col>
  </v-container>
</template>
<script setup lang="ts">
import VenueDAO from '@/dao/VenueDAO'
import type Venue from '@/entity/Venue'
import { useLayout } from '@/services/LayoutService'
import { useDocument } from 'vuefire'
const { gridSize } = useLayout()

const props = defineProps<{
  id: string
}>()

function makeParts(venue: Venue) {
  return [
    'https://maps.google.com/maps?&q=',
    encodeURIComponent(`${venue.name} ${venue.address}`.replace(/\s/g, '+')),
    '&output=embed',
  ]
}

const embeddedUrl = (venue: Venue) => makeParts(venue).join('')

const linkUrl = (venue: Venue) => makeParts(venue).slice(0, 2).join('')

const lineBreaks = (s: string) => s.replace(/\n/g, '<br>')

const venue = useDocument(() => VenueDAO.getById(props.id))
</script>
