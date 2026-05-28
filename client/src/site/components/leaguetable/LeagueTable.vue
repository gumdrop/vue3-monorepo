<template>
  <v-slide-y-transition>
    <div v-if="table" class="league-table-container mb-6">
      <table class="ql-league-table">
        <caption v-if="table.description">{{ table.description }}</caption>
        <thead>
          <tr>
            <th class="text-center">Pos</th>
            <th class="text-left">Team</th>
            <th class="text-center">Pl</th>
            <th class="text-center">W</th>
            <th class="text-center">D</th>
            <th class="text-center">L</th>
            <th class="text-center">S</th>
            <th class="text-center">Pts</th>
          </tr>
        </thead>
        <tbody>
          <LeagueTableRow :row="row" v-for="row in table.rows" :key="row.team.id" />
        </tbody>
      </table>
    </div>
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
.league-table-container {
  background-color: white;
  border-radius: 8px;
  overflow: hidden;
}

.ql-league-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
  line-height: 1.5;
}

caption {
  text-align: left;
  padding: 16px;
  font-size: 1.1rem;
  font-weight: 600;
  color: #1a1a1a;
  background-color: #fdfdfd;
  border-bottom: 1px solid #eee;
}

th {
  background-color: #f8f9fa;
  color: #5f6368;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 12px 8px;
  border-bottom: 2px solid #edf2f7;
}

.text-center {
  text-align: center;
}

.text-left {
  text-align: left;
  padding-left: 16px;
}

@media (max-width: 600px) {
  .ql-league-table {
    font-size: 13px;
  }
  th, .text-left {
    padding-left: 8px;
    padding-right: 4px;
  }
}
</style>
