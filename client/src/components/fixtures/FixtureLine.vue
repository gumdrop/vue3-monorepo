<template>
  <tr v-if="inlineDetails && $vuetify.display.smAndDown">
    <td class="inline-details" colspan="6">
      <v-skeleton-loader v-if="!(parent && competition)" type="text" width="15em"></v-skeleton-loader>
      <span v-if="parent && competition">
        <span v-if="!$vuetify.display.smAndDown">{{ date(parent.date, "d MMM yyyy") }}</span>
        <span v-else>{{ date(parent.date, "d MMM yyyy") }}</span> : {{ competition.name }} {{ parent.description }}
      </span>
    </td>
  </tr>
  <tr v-if="fixture && home && away">
    <td v-if="inlineDetails && !$vuetify.display.smAndDown" class="inline-details">
      <v-skeleton-loader v-if="!(parent && competition)" type="text" width="15em"></v-skeleton-loader>
      <span v-if="parent && competition">
        <span v-if="!$vuetify.display.smAndDown">{{ date(parent.date, "d MMM yyyy") }}</span><span v-else>{{
          date(parent.date,
            "d-MM-yy") }}</span> : {{ competition.name }} {{ parent.description }}
      </span>
    </td>
    <td v-if="!fixture.result" class="home" :class="(inlineDetails && $vuetify.display.smAndDown) ? 'inline' : ''"
      style="min-width:5em;">
      <ResponsiveTeamName :team="home" />
    </td>
    <td v-else class="home"
      :class="((inlineDetails && $vuetify.display.smAndDown) ? 'inline' : '') + ' ' + nameClass(fixture.result.homeScore, fixture.result.awayScore)"
      style="min-width:5em;">
      <ResponsiveTeamName :team="home" />
    </td>
    <td v-if="!fixture.result"></td>
    <td v-else class="score">{{ fixture.result.homeScore }}</td>
    <td> - </td>
    <td v-if="!fixture.result"></td>
    <td v-else class="score">{{ fixture.result.awayScore }}</td>
    <td v-if="!fixture.result" class="away">
      <ResponsiveTeamName :team="away" />
    </td>
    <td v-else class="away" :class="nameClass(fixture.result.awayScore, fixture.result.homeScore)">
      <ResponsiveTeamName :team="away" />
    </td>
    <td v-if="!fixture.result"></td>
    <td v-else>
      <div v-if="reports && reports.length > 0">
        <v-tooltip location="top" text="Match Reports">
          <template v-slot:activator="{ props }">
            <v-btn density="compact" icon exact flat @click.stop="showReports = true" v-on="props" style="top:-2px">
              <v-icon style="transform:scale(0.75)" size="22px">mdi-file-document-outline</v-icon>
            </v-btn>
          </template>
        </v-tooltip>
      </div>
      <v-dialog v-model="showReports" max-width="60%" v-bind="dialogSize" v-if="reports">
        <v-card>
          <v-card-title>Reports ::&nbsp;
            <ResponsiveTeamName :team="home" />
            &nbsp;{{ fixture.result.homeScore }} - {{ fixture.result.awayScore }}&nbsp;
            <ResponsiveTeamName :team="away" />
          </v-card-title>
          <MatchReports :keyval="`${fixture.key}`" />
          <div v-if="parent">
            <ql-chat :lockedFilter="filter(home, away)" name="homepagechat" :outlined="false"
              displayName="Match Chat"></ql-chat>
          </div>
          <v-card-actions>
            <v-spacer></v-spacer>
            <ql-login-button label="Login for chat"></ql-login-button>
            <v-tooltip location="top" text="Close">
              <template v-slot:activator="{ props }">
                <v-btn icon exact flat v-on:click="showReports = false" v-on="props">
                  <v-icon>mdi-close</v-icon>
                </v-btn>
              </template>
            </v-tooltip>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </td>
  </tr>
</template>
<script setup lang="ts">
import CompetitionDAO from '@/dao/CompetitionDAO';
import FixturesDAO, { reportDAO } from '@/dao/FixturesDAO';
import TeamDAO from '@/dao/TeamDAO';
import type { Fixture } from '@/entity/Fixtures';
import type Team from '@/entity/Team';
import { useDateTime } from '@/services/DateService';
import { useDialog } from '@/services/DialogService';
import { useKey } from '@/services/KeyService';
import { ref } from 'vue';
import { useCollection, useDocument } from 'vuefire';
import ResponsiveTeamName from '../common/ResponsiveTeamName.vue';
import MatchReports from './MatchReports.vue';

const props = defineProps<{
  fixture: Fixture
  inlineDetails?: boolean
}>()

const { date } = useDateTime()

const showReports = ref(false)

const nameClass = (score1: number, score2: number) => (score1 > score2) ? "winner" : ""

const filter = (home: Team, away: Team) => `#${home.handle}vs${away.handle}`

const { parseParent } = useKey()

const { dialogSize } = useDialog()



const fixsPath = parseParent(props.fixture.key)

const parent = useDocument(FixturesDAO.getByPath(fixsPath))
const competition = useDocument(CompetitionDAO.getByPath(parseParent(fixsPath)))
const reports = useCollection(reportDAO.subCollection(`${props.fixture.key}`))
const home = useDocument(() => TeamDAO.getById(props.fixture.home.id))
const away = useDocument(() => TeamDAO.getById(props.fixture.away.id))

</script>
<style lang="css" scoped>
.inline-details {
  font-style: italic;
  padding-right: .5em;
  color: darkblue;
}

.home {
  text-align: right;
  padding-right: 1em;
}

.away {
  padding-left: 1em;
}

.winner {
  color: darkred;
  font-weight: 600;
}

.score {
  font-weight: 500;
}
</style>
