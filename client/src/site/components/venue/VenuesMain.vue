<template>
  <v-container fluid v-b :class="gridSize">
    <v-col width="12">
      <div>
        <QlTextBox>
          <QlNamedText textName="venues-front-page"></QlNamedText>
        </QlTextBox>
      </div>
      <div v-if="smAndDown">
        <v-list>
          <v-list-item :to="'/venue/' + venue.id" v-for="venue in venues" :key="venue.id" :title="venue.name">
          </v-list-item>
        </v-list>
      </div>
    </v-col>
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
