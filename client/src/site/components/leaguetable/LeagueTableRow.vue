<template>
  <tr class="league-table-row" :class="{ 'highlight-team': isUserTeam }">
    <td class="text-center pos-col">{{ row.position }}</td>
    <td class="team-col">
      <router-link :to="'/team/' + teamId" class="team-link">
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
import { computed } from 'vue'
import ResponsiveTeamName from '../common/ResponsiveTeamName.vue'
import { useUserStore } from '@/stores/app'

const { row } = defineProps<{ row: LeagueTableRow }>()
const userStore = useUserStore()

type InternalFirestorePath = {
  canonicalString?: () => string
  segments?: string[]
}

type TeamReferenceLike = {
  id?: unknown
  path?: unknown
  _path?: InternalFirestorePath
  _key?: {
    path?: InternalFirestorePath
  }
}

const pathFromSegments = (segments: string[]) => {
  const documentsIndex = segments.indexOf('documents')
  const documentPathSegments = documentsIndex >= 0 ? segments.slice(documentsIndex + 1) : segments

  return documentPathSegments.join('/')
}

const internalPath = (path?: InternalFirestorePath) => {
  if (!path) return ''

  if (typeof path.canonicalString === 'function') {
    return path.canonicalString()
  }

  return Array.isArray(path.segments) ? pathFromSegments(path.segments) : ''
}

const teamPath = computed(() => {
  const teamReference = row.team as LeagueTableRow['team'] | string
  if (typeof teamReference === 'string') return teamReference

  const referenceLike = teamReference as TeamReferenceLike
  if (typeof referenceLike.path === 'string') return referenceLike.path

  const path = internalPath(referenceLike._path) || internalPath(referenceLike._key?.path)
  if (path) return path

  return typeof referenceLike.id === 'string' ? `team/${referenceLike.id}` : ''
})

const teamId = computed(() => teamPath.value.split('/').filter(Boolean).pop() ?? '')
const isUserTeam = computed(() => userStore.user?.team?.id === teamId.value)

const team = useDocument(() => (teamId.value ? TeamDAO.getById(teamId.value) : undefined), {
  maxRefDepth: 0,
})
</script>
<style lang="css" scoped>
.league-table-row {
  transition: background-color 0.2s ease;
}

.highlight-team {
  background-color: rgba(var(--v-theme-primary), 0.1);
}

.league-table-row:hover {
  background-color: rgba(var(--v-theme-on-surface), 0.04);
}

.league-table-row:last-child td {
  border-bottom: none;
}

td {
  padding: 12px 8px;
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  color: rgba(var(--v-theme-on-surface), 0.87);
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
  color: rgb(var(--v-theme-primary));
  font-weight: 500;
  transition: color 0.2s ease;
}

.team-link:hover {
  color: rgba(var(--v-theme-primary), 0.8);
  text-decoration: underline;
}

.pos-col {
  font-weight: 500;
  color: rgba(var(--v-theme-on-surface), 0.55);
  width: 40px;
}

.num-col {
  color: rgba(var(--v-theme-on-surface), 0.7);
}

.pts-col {
  font-weight: 700;
  color: rgb(var(--v-theme-on-surface));
  background-color: rgba(var(--v-theme-primary), 0.04);
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
