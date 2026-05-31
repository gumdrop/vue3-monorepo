<template>
  <v-container v-if="team && seasonId" :class="gridSize" fluid class="pa-0">
    <v-row>
      <!-- Team Description / Text -->
      <v-col cols="12" v-if="team.text?.id">
        <div class="content-wrapper mb-6">
          <QlTextBox>
            <QlText :id="team.text.id" />
          </QlTextBox>
        </div>
      </v-col>

      <!-- Team Info & Standings -->
      <v-col cols="12" lg="4">
        <TeamStandings :teamId="team.id" class="mb-6" />
      </v-col>

      <!-- Results & Fixtures -->
      <v-col cols="12" lg="8">
        <div class="match-sections">
          <TeamResults :teamId="team.id" class="mb-6" />
          <TeamFixtures :teamId="team.id" class="mb-6" />
        </div>
      </v-col>
    </v-row>
  </v-container>
</template>
<script setup lang="ts">
import TeamDAO from '@/dao/TeamDAO'
import { useLayout } from '@/services/LayoutService'
import { useTeamStore } from '@/stores/teams'
import { useDocument } from 'vuefire'
import QlText from '../text/QlText.vue'
import QlTextBox from '../text/QlTextBox.vue'
import TeamFixtures from './TeamFixtures.vue'
import TeamResults from './TeamResults.vue'
import TeamStandings from './TeamInfo.vue'

const props = defineProps<{
  id: string
}>()

const { gridSize } = useLayout()
const { seasonId } = useTeamStore()

const team = useDocument(() => TeamDAO.getById(props.id))
</script>
<style scoped>
.content-wrapper {
  background-color: white;
  border-radius: 12px;
  overflow: hidden;
}

@media (min-width: 1280px) {
  .match-sections {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
}
</style>
