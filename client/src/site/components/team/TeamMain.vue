<template>
  <v-container v-if="team && seasonId" :class="gridSize" fluid>
    <v-col>
      <QlTextBox v-if="team.text.text">
        <QlText :id="team.text.id" />
      </QlTextBox>
    </v-col>
    <v-col>
      <TeamStandings :teamId="team.id" />
    </v-col>
    <v-col>
      <TeamResults :teamId="team.id" />
    </v-col>
    <v-col>
      <TeamFixtures :teamId="team.id" />
    </v-col>
  </v-container>
</template>
<script setup lang="ts">
import TeamDAO from '@/dao/TeamDAO';
import { useLayout } from '@/services/LayoutService';
import { useTeamStore } from '@/stores/teams';
import { useDocument } from 'vuefire';
import QlText from '../text/QlText.vue';
import QlTextBox from '../text/QlTextBox.vue';
import TeamFixtures from './TeamFixtures.vue';
import TeamResults from './TeamResults.vue';
import TeamStandings from './TeamInfo.vue';

const props = defineProps<{
  id: string
}>()

const { gridSize } = useLayout()
const { seasonId } = useTeamStore()

const team = useDocument(() => TeamDAO.getById(props.id))
</script>
