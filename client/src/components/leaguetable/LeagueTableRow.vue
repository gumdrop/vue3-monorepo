<template>
  <tr>
    <td>{{ row.position }}</td>
    <td><router-link :to="'/team/' + row.team.id">
        <ResponsiveTeamName :team="row.team" />
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
import { LeagueTableRow } from '@/entity/LeagueTable';
import ResponsiveTeamName from '../common/ResponsiveTeamName.vue';

const { row } = defineProps<{ row: LeagueTableRow }>()
</script>
<style lang="css" scoped>
td {
  border-bottom: 0.5px solid rgba(0, 0, 0, .25);
  border-right: 0.5px solid rgba(0, 0, 0, .25);
  padding-right: 2px;
}

.num {
  min-width: 2em;
  text-align: right;
}
</style>
