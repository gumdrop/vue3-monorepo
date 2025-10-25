<template>
  <v-slide-y-transition>
    <table v-if="table" class="mat-elevation-z3 ql-league-table elevation-3">
      <caption>{{ table.description }}</caption>
      <thead>
        <tr>
          <th>Pos.</th>
          <th>Team</th>
          <th>Pl.</th>
          <th>W</th>
          <th>D</th>
          <th>L</th>
          <th>S</th>
          <th>Pts</th>
        </tr>
      </thead>
      <tbody>
        <LeagueTableRow :row="row" v-for="row in table.rows" :key="row.team.id" />
      </tbody>
    </table>
  </v-slide-y-transition>
</template>
<script setup lang="ts">
import LeagueTableDAO from '@/dao/LeagueTableDAO';
import { useDocument } from 'vuefire';
import LeagueTableRow from './LeagueTableRow.vue';

const props = defineProps<{ path: string }>()

const table = useDocument(() => LeagueTableDAO.getByPath(props.path))
</script>
<style lang="css" scoped>
.ql-league-table {
  font-size: 14px;
}

caption {
  text-align: left;
  font-size: 16px;
  font-weight: 500;
  font-family: Roboto, "Helvetica Neue", sans-serif;
}

th {
  border-bottom: 0.5px solid rgba(0, 0, 0, .50);
  border-right: 0.5px solid rgba(0, 0, 0, .50);
  font-weight: 600;
  text-align: center;
}
</style>
