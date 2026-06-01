<template>
  <div v-if="!fixture" class="d-flex justify-center pa-8">
    <v-progress-circular indeterminate color="primary" size="48"></v-progress-circular>
  </div>
  
  <v-card v-if="fixture" class="submit-result-card elevation-2 overflow-hidden">
    <v-toolbar color="grey-lighten-4" density="compact" flat>
      <v-toolbar-title class="text-subtitle-2 font-weight-bold grey--text text--darken-2">
        Match Details
      </v-toolbar-title>
    </v-toolbar>
    
    <v-card-text class="pa-0">
      <div class="match-info pa-4 bg-white">
        <SimpleFixtures :fixtures="[fixtureDoc]" inline-details />
      </div>
      
      <v-divider></v-divider>
      
      <v-form v-model="valid" class="pa-6">
        <v-row v-if="!fixture.result" class="score-input-section mb-6">
          <v-col cols="12" sm="6">
            <v-text-field
              v-model.number="result.homeScore"
              :rules="[required('Home Score')]"
              :label="homeTeamName || 'Home Score'"
              type="number"
              variant="outlined"
              prepend-inner-icon="mdi-numeric"
              class="score-field"
            >
              <template v-slot:prepend v-if="homeTeamName">
                <div class="team-label text-truncate" style="max-width: 120px;">{{ homeTeamName }}</div>
              </template>
            </v-text-field>
          </v-col>
          <v-col cols="12" sm="6">
            <v-text-field
              v-model.number="result.awayScore"
              :rules="[required('Away Score')]"
              :label="awayTeamName || 'Away Score'"
              type="number"
              variant="outlined"
              prepend-inner-icon="mdi-numeric"
              class="score-field"
            >
              <template v-slot:prepend v-if="awayTeamName">
                <div class="team-label text-truncate" style="max-width: 120px;">{{ awayTeamName }}</div>
              </template>
            </v-text-field>
          </v-col>
        </v-row>

        <v-textarea 
          v-model="reportText" 
          variant="outlined" 
          auto-grow 
          label="Match Report" 
          placeholder="Enter match highlights, standout performances, or any notable incidents..."
          prepend-inner-icon="mdi-text-box-outline"
          class="report-field"
        >
          <template v-slot:append-inner>
            <v-tooltip location="top" text="Preview Report">
              <template v-slot:activator="{ props }">
                <v-btn 
                  v-bind="props" 
                  icon="mdi-eye-outline" 
                  variant="text" 
                  color="info" 
                  density="comfortable"
                  @click="preview = !preview"
                  :class="{ 'preview-active': preview }"
                ></v-btn>
              </template>
            </v-tooltip>
          </template>
        </v-textarea>

        <v-expand-transition>
          <v-card v-if="preview" class="report-preview mt-4 mb-6 border">
            <v-toolbar density="compact" color="info-lighten-5" flat>
              <v-icon color="info" start class="ml-4">mdi-eye-outline</v-icon>
              <v-toolbar-title class="text-subtitle-2 font-weight-bold info--text">Report Preview</v-toolbar-title>
            </v-toolbar>
            <v-card-text class="pa-4 bg-grey-lighten-5">
              <QlMarkdown :text="reportText || '*No report text entered yet*'" />
            </v-card-text>
          </v-card>
        </v-expand-transition>

        <div class="d-flex justify-end mt-4">
          <v-btn
            @click="preSubmit(fixture, user?.siteUser?.user?.id!, reportText)"
            color="primary"
            :disabled="!canSubmit"
            :loading="submitting"
            size="large"
            elevation="2"
            class="px-8 rounded-pill"
          >
            <v-icon start>mdi-send</v-icon>
            Submit Result
          </v-btn>
        </div>
      </v-form>
    </v-card-text>

    <!-- Confirmation Dialog -->
    <v-dialog v-model="confirm" persistent max-width="600px" v-bind="dialogSize">
      <v-card class="rounded-xl overflow-hidden">
        <v-toolbar color="primary" density="compact" flat>
          <v-toolbar-title class="text-h6 font-weight-bold">Confirm Submission</v-toolbar-title>
        </v-toolbar>
        <v-card-text class="pa-6">
          <p class="text-body-1 mb-4">Please verify the result before finalizing:</p>
          <div class="confirmation-match-view pa-4 bg-grey-lighten-4 rounded-lg">
            <table v-if="fixtureForSubmission" class="w-100">
              <FixtureLine :fixture="fixtureForSubmission" inline-details />
            </table>
          </div>
        </v-card-text>
        <v-divider></v-divider>
        <v-card-actions class="pa-4">
          <v-spacer></v-spacer>
          <v-btn variant="text" color="grey-darken-1" @click="confirm = false" class="px-4">
            <v-icon start>mdi-close</v-icon>
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            variant="elevated"
            :loading="submitting"
            :disabled="submitting"
            @click="confirmSubmit"
            class="px-6 ml-2"
          >
            <v-icon start>mdi-check</v-icon>
            Confirm & Submit
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-card>
</template>
<script setup lang="ts">
import { Result, type Fixture } from '@/entity/Fixtures'
import type { DocumentReference } from 'firebase/firestore'
import { ref, computed } from 'vue'
import { useDocument } from 'vuefire'
import SimpleFixtures from '../fixtures/SimpleFixtures.vue'
import { useValidations } from '../Validation'
import QlMarkdown from '../text/QlMarkdown.vue'
import FixtureLine from '../fixtures/FixtureLine.vue'
import { useFixture } from '@/services/FixtureService'
import { useUserStore } from '@/stores/app'
import TeamDAO from '@/dao/TeamDAO'
import { storeToRefs } from 'pinia'

const { fixtureDoc } = defineProps<{ fixtureDoc: DocumentReference<Fixture> }>()
const { submitResult } = useFixture()

const { required } = useValidations()

const fixture = useDocument(fixtureDoc)
const fixtureForSubmission = useDocument(fixtureDoc, { maxRefDepth: 0 })

const homeTeam = useDocument(() => fixture.value ? TeamDAO.getById(fixture.value.home.id) : null)
const awayTeam = useDocument(() => fixture.value ? TeamDAO.getById(fixture.value.away.id) : null)

const homeTeamName = computed(() => homeTeam.value?.name)
const awayTeamName = computed(() => awayTeam.value?.name)

const result = ref(new Result(0, 0))
const valid = ref(false)
const preview = ref(false)
const confirm = ref(false)
const submitting = ref(false)
const reportText = ref('')
const dialogSize = {}
const { user } = storeToRefs(useUserStore())
const reportHasValue = computed(() => reportText.value.trim().length > 0)
const canSubmit = computed(
  () => valid.value && !submitting.value && (!fixture.value?.result || reportHasValue.value),
)

const preSubmit = async (fixture: Fixture, userId: string, submittedReportText?: string) => {
  if (fixture.result) {
    await submit(fixture, userId, submittedReportText)
  } else {
    const fixtureInFlight = { ...fixture }
    fixtureInFlight.result = result.value
    fixtureForSubmission.value = fixtureInFlight
    confirm.value = true
  }
}

const submit = async (fixture: Fixture, userId: string, submittedReportText?: string) => {
  submitting.value = true
  try {
    await submitResult(fixture.path, userId, fixture.result!, submittedReportText)
    reportText.value = ''
    confirm.value = false
  } finally {
    submitting.value = false
  }
}

const confirmSubmit = async () => {
  const userId = user.value?.siteUser?.user?.id
  if (!fixtureForSubmission.value || !userId) return

  await submit(fixtureForSubmission.value, userId, reportText.value)
}
</script>
<style scoped>
.submit-result-card {
  border-radius: 16px !important;
  border: 1px solid #e2e8f0 !important;
}

.match-info {
  border-bottom: 1px solid #f1f5f9;
}

.team-label {
  font-size: 0.85rem;
  font-weight: 700;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-right: 8px;
}

.score-field :deep(.v-field__input) {
  font-size: 1.25rem;
  font-weight: 700;
  text-align: center;
}

.report-field :deep(.v-field__input) {
  font-size: 1rem;
  line-height: 1.6;
}

.preview-active {
  background-color: rgba(59, 130, 246, 0.1);
}

.report-preview {
  border-radius: 12px;
  overflow: hidden;
}

.confirmation-match-view {
  border: 1px solid #e2e8f0;
}

@media (max-width: 600px) {
  .team-label {
    display: none;
  }
  .score-field :deep(.v-field__input) {
    font-size: 1.1rem;
  }
}
</style>
