<template>


  <v-combobox v-model="chips" :items="teams" label="Teams" chips clearable solo multiple>
    <template v-slot:selection="data">
      <v-chip>
        {{ data.item.title }}
      </v-chip>
    </template>
  </v-combobox>

  <v-row wrap v-if="teamId && allSeasons && allSeasons.length > 0" justify="space-around" j>
    <v-col>
      <HeadToHeadLeaguePosition :stats="allSeasons" />
    </v-col>
    <v-col>
      <HeadToHeadAverageScore :stats="allSeasons" />
    </v-col>
    <v-col>
      <HeadToHeadResults :stats="allSeasons" />
    </v-col>

  </v-row>

</template>
<script setup lang="ts">
import TeamDAO from '@/dao/TeamDAO';
import { useTeams } from '@/services/TeamService';
import { usePromise } from '@/utils/PromiseRef';
import { computed, ref } from 'vue';
import { useCollection } from 'vuefire';
import HeadToHeadAverageScore from './HeadToHeadAverageScore.vue';
import HeadToHeadLeaguePosition from './HeadToHeadLeaguePosition.vue';
import HeadToHeadResults from './HeadToHeadResults.vue';

const { teamId } = defineProps<{ teamId: string }>()

const { allSeasonsMultipleTeamStats } = useTeams()

const chips = ref<{ title: string, id: string }[]>([])

const allSeasons = usePromise(() => allSeasonsMultipleTeamStats([teamId].concat(chips.value.map(c => c.id))))

const teamList = useCollection(() => TeamDAO.sortedActive("name"))
const teams = computed(() => teamList.value.map(t => { return { title: t.name, id: t.id } }).filter(t => t.id != teamId))

</script>
