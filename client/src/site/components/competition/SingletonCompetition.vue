<template>
  <v-container :class="gridSize" v-if="item" fluid>
    <v-col align-content-start>
      <QlTextBox>
        <QlNamedText :textName="item.textName"></QlNamedText>
      </QlTextBox>
    </v-col>
    <v-col>
      <v-card>
        <v-card-text>
          <div><b>This season's competition will take place at <a :to="'/venue/' + item.event.venue.id">{{
            item.event.venue.name }}</a> on {{ date(item.event.date, "d MMMM yyyy")
                }} starting at {{ item.event.time }}</b> </div>
          <br>
          <QlText :id="item.text.id" v-if="item.text" />
        </v-card-text>
      </v-card>
    </v-col>
  </v-container>
</template>
<script setup lang="ts">
import CompetitionDAO from '@/dao/CompetitionDAO';
import { useKey } from '@/services/KeyService';
import { computed } from 'vue';
import { useDocument } from 'vuefire';
import QlNamedText from '../text/QlNamedText.vue';
import QlText from '../text/QlText.vue';
import QlTextBox from '../text/QlTextBox.vue';
import { useDateTime } from '@/services/DateService';
import { useLayout } from '@/services/LayoutService';
const { gridSize } = useLayout()

const { decode } = useKey()
const { date } = useDateTime()

const props = defineProps<{ path: string }>()
const path = computed(() => decode(props.path))
const item = useDocument(() => CompetitionDAO.getByPath(path.value))

</script>
