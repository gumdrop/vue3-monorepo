<template>
  <tr class="league-table-row">
    <td class="text-center pos-col">{{ row.position }}</td>
    <td class="team-col">
      <router-link :to="'/team/' + row.team.id" class="team-link">
        <ResponsiveTeamName v-if="team" :team="team" />
      </router-link>
    </td>
    <td class="text-center num-col">{{ row.played }}</td>
    <td class="text-center num-col">{{ row.won }}</td>
    <td class="text-center num-col">{{ row.drawn }}</td>
    <td class="text-center num-col">{{ row.lost }}</td>
    <td class="text-center num-col">{{ row.matchPointsFor }}</td>
    <td class="text-center pts-col">{{ row.leaguePoints }}</td>
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
.league-table-row {
  transition: background-color 0.2s ease;
}

.league-table-row:hover {
  background-color: #f1f5f9;
}

.league-table-row:last-child td {
  border-bottom: none;
}

td {
  padding: 12px 8px;
  border-bottom: 1px solid #f0f0f0;
  color: #374151;
  vertical-align: middle;
}

.text-center {
  text-align: center;
}

.team-col {
  padding-left: 16px;
  width: 40%;
}

.team-link {
  text-decoration: none;
  color: #2563eb;
  font-weight: 500;
  transition: color 0.2s ease;
}

.team-link:hover {
  color: #1d4ed8;
  text-decoration: underline;
}

.pos-col {
  font-weight: 500;
  color: #6b7280;
  width: 40px;
}

.num-col {
  color: #4b5563;
}

.pts-col {
  font-weight: 700;
  color: #111827;
  background-color: rgba(37, 99, 235, 0.03);
}

@media (max-width: 600px) {
  td {
    padding: 10px 4px;
  }
  .team-col {
    padding-left: 8px;
  }
}
</style>
