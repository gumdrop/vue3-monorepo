<template>
  <!-- Mobile Inline Details Row -->
  <tr v-if="inlineDetails && $vuetify.display.smAndDown" class="details-row">
    <td colspan="6" class="inline-details-cell">
      <v-skeleton-loader v-if="!(parent && competition)" type="text" width="12em"></v-skeleton-loader>
      <div v-if="parent && competition" class="details-content">
        <span class="details-date">{{ date(parent.date, "d MMM yyyy") }}</span>
        <span class="details-sep">•</span>
        <span class="details-comp">{{ competition.name }}</span>
        <span v-if="parent.description" class="details-desc">{{ parent.description }}</span>
      </div>
    </td>
  </tr>

  <!-- Main Fixture/Result Row -->
  <tr v-if="fixture && home && away" class="match-row" :class="{ 'has-result': fixture.result }">
    <!-- Desktop Inline Details Column -->
    <td v-if="inlineDetails && !$vuetify.display.smAndDown" class="inline-details-col">
      <v-skeleton-loader v-if="!(parent && competition)" type="text" width="10em"></v-skeleton-loader>
      <div v-if="parent && competition" class="details-content-stacked">
        <div class="details-date">{{ date(parent.date, "d MMM yyyy") }}</div>
        <div class="details-comp">{{ competition.name }}</div>
      </div>
    </td>

    <!-- Home Team -->
    <td class="team-cell home-team" :class="[
      (inlineDetails && $vuetify.display.smAndDown) ? 'is-inline' : '',
      fixture.result && nameClass(fixture.result.homeScore, fixture.result.awayScore)
    ]">
      <div class="team-name-wrapper">
        <ResponsiveTeamName :team="home" />
      </div>
    </td>

    <!-- Score/VS -->
    <td class="score-cell">
      <div v-if="fixture.result" class="score-display">
        <span class="score-num" :class="nameClass(fixture.result.homeScore, fixture.result.awayScore)">{{
          fixture.result.homeScore }}</span>
        <span class="score-divider">-</span>
        <span class="score-num" :class="nameClass(fixture.result.awayScore, fixture.result.homeScore)">{{
          fixture.result.awayScore }}</span>
      </div>
      <div v-else class="vs-label">vs</div>
    </td>

    <!-- Away Team -->
    <td class="team-cell away-team" :class="fixture.result && nameClass(fixture.result.awayScore, fixture.result.homeScore)">
      <div class="team-name-wrapper">
        <ResponsiveTeamName :team="away" />
      </div>
    </td>

    <!-- Actions (Reports) -->
    <td class="actions-cell">
      <div v-if="reports && reports.length > 0" class="reports-action">
        <v-tooltip location="top" text="Match Reports">
          <template v-slot:activator="{ props }">
            <v-btn density="comfortable" icon variant="text" color="primary" @click.stop="showReports = true"
              v-bind="props" class="report-btn">
              <v-icon size="20">mdi-file-document-outline</v-icon>
            </v-btn>
          </template>
        </v-tooltip>
      </div>

      <!-- Reports Dialog -->
      <v-dialog v-model="showReports" max-width="800px" v-bind="dialogSize">
        <v-card class="reports-dialog-card">
          <v-toolbar color="primary" density="compact" flat>
            <v-toolbar-title class="text-subtitle-1 font-weight-bold d-flex align-center">
              Match Report: <ResponsiveTeamName v-if="home" :team="home" class="mx-1" /> vs <ResponsiveTeamName v-if="away" :team="away" class="mx-1" />
            </v-toolbar-title>
            <v-spacer></v-spacer>
            <v-btn icon @click="showReports = false">
              <v-icon>mdi-close</v-icon>
            </v-btn>
          </v-toolbar>

          <v-card-text class="pa-0">
            <div class="match-summary-banner pa-4 text-center">
              <div class="d-flex align-center justify-center ga-4 flex-wrap">
                <div class="text-h6 font-weight-bold"><ResponsiveTeamName v-if="home" :team="home" /></div>
                <div class="text-h4 font-weight-black mx-4" v-if="fixture.result">
                  {{ fixture.result.homeScore }} - {{ fixture.result.awayScore }}
                </div>
                <div class="text-h6 font-weight-bold"><ResponsiveTeamName v-if="away" :team="away" /></div>
              </div>
            </div>

            <MatchReports :keyval="`${fixture.key}`" />

            <div v-if="parent" class="match-chat-container pa-4 border-t">
              <ql-chat :lockedFilter="filter(home, away)" name="homepagechat" :outlined="false"
                displayName="Match Chat"></ql-chat>
            </div>
          </v-card-text>
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
.match-row {
  transition: background-color 0.2s ease;
  border-bottom: 1px solid #f1f5f9;
}

.match-row:hover {
  background-color: #f8fafc;
}

.match-row:last-child {
  border-bottom: none;
}

/* Inline Details Styling */
.details-row {
  background-color: #fcfdfe;
}

.inline-details-cell {
  padding: 8px 16px 4px;
}

.details-content {
  display: flex;
  align-items: center;
  font-size: 0.75rem;
  color: #64748b;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

.details-sep {
  margin: 0 8px;
  color: #cbd5e1;
}

.details-desc {
  margin-left: 8px;
  font-style: italic;
  color: #94a3b8;
}

.inline-details-col {
  padding: 12px 16px;
  width: 136px;
  border-right: 1px solid #f1f5f9;
}

.details-content-stacked {
  font-size: 0.75rem;
  line-height: 1.4;
}

.details-date {
  color: #1e293b;
  font-weight: 600;
}

.details-comp {
  color: #64748b;
}

/* Team Styling */
.team-cell {
  padding: 12px 8px;
  overflow: hidden;
  width: auto;
}

.home-team {
  text-align: right;
  padding-right: 16px;
}

.away-team {
  text-align: left;
  padding-left: 16px;
}

.team-name-wrapper {
  display: block;
  font-size: 0.95rem;
  font-weight: 500;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #334155;
}

.winner .team-name-wrapper {
  color: #1e293b;
  font-weight: 700;
}

/* Score Styling */
.score-cell {
  padding: 12px 4px;
  text-align: center;
  min-width: 88px;
  width: 88px;
}

.score-display {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background-color: #f1f5f9;
  box-sizing: border-box;
  max-width: 100%;
  padding: 4px 10px;
  border-radius: 6px;
  font-family: 'Roboto Mono', monospace;
  font-weight: 700;
  white-space: nowrap;
}

.score-num {
  font-size: 1.1rem;
  min-width: 1.2em;
}

.score-num.winner {
  color: #2563eb;
}

.score-divider {
  margin: 0 4px;
  color: #94a3b8;
  font-weight: 400;
}

.vs-label {
  font-size: 0.75rem;
  font-weight: 700;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

/* Actions Styling */
.actions-cell {
  padding: 8px;
  width: 40px;
  text-align: center;
}

.report-btn {
  opacity: 0.6;
  transition: opacity 0.2s, transform 0.2s;
}

.match-row:hover .report-btn {
  opacity: 1;
}

.report-btn:hover {
  transform: scale(1.1);
}

/* Dialog Styling */
.match-summary-banner {
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-bottom: 1px solid #e2e8f0;
}

@media (max-width: 600px) {
  .team-cell {
    padding: 10px 4px;
  }

  .home-team {
    padding-right: 8px;
  }

  .away-team {
    padding-left: 8px;
  }

  .team-name-wrapper {
    font-size: 0.875rem;
  }

  .score-cell {
    min-width: 64px;
    width: 64px;
  }

  .score-display {
    padding: 2px 8px;
  }

  .score-num {
    font-size: 0.95rem;
  }
}
</style>
