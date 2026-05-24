<template>
  <tr>
    <td>{{ row.position }}</td>
    <td>
      <router-link :to="'/team/' + row.team.id">
        <ResponsiveTeamName v-if="team" :team="team" />
      </router-link>
    </td>
    <td class="num">{{ row.played }}</td>
    <td class="num">{{ row.won }}</td>
    <td class="num">{{ row.drawn }}</td>
    <td class="num">{{ row.lost }}</td>
    <td class="num">{{ row.matchPointsFor }}</td>
    <td class="num">{{ row.leaguePoints }}</td>
  </tr>
</template>
<script setup lang="ts">
import TeamDAO from '@/dao/TeamDAO'
import type { LeagueTableRow } from '@/entity/LeagueTable'
import { useDocument } from 'vuefire'
import ResponsiveTeamName from '../common/ResponsiveTeamName.vue'

const { row } = defineProps<{ row: LeagueTableRow }>()
const team = useDocument(() => TeamDAO.getById(row.team.id))
</script>
<style lang="css" scoped>
td {
  border-bottom: 0.5px solid rgba(0, 0, 0, 0.25);
  border-right: 0.5px solid rgba(0, 0, 0, 0.25);
  padding-right: 2px;
}

.num {
  min-width: 2em;
  text-align: right;
}
</style>
