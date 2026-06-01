<template>
  <div>
    <QlSideMenu
      :title="'Competitions ' + formatSeason(season)"
      icon="mdi-trophy"
      v-if="competitions && season"
    >
      <SideMenuItem
        v-for="competition in competitions"
        :key="competition.id"
        :to="`/competition/${encode(competition.path)}/${competition._name}`"
        :prepend-icon="competition.icon"
        :title="competition.name"
      />
    </QlSideMenu>
    <v-divider></v-divider>
    <CompetitionStatisticsMenu />
  </div>
</template>
<script setup lang="ts">
import SeasonDao from '@/dao/SeasonDAO'
import { useCompetitions } from '@/services/CompetitionService'
import { useKey } from '@/services/KeyService'
import { useSeason } from '@/services/SeasonService'
import { useSideMenuStore } from '@/stores/app'
import { useCompetition } from '@/stores/competiton'
import { usePromise } from '@/utils/PromiseRef'
import { useDocument } from 'vuefire'
import QlSideMenu from '../common/SideMenu.vue'
import SideMenuItem from '../common/SideMenuItem.vue'
import CompetitionStatisticsMenu from './statistics/CompetitionStatisticsMenu.vue'

const { setSidemenu } = useSideMenuStore()
setSidemenu(true)

const { encode } = useKey()

const { seasonId } = useCompetition()

const { formatSeason } = useSeason()
const { competitions: getComps } = useCompetitions()

const competitions = usePromise(() => getComps(`${seasonId.value}`))

const season = useDocument(() => SeasonDao.getById(seasonId.value))
</script>
