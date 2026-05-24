<template>
  <v-col align-center style="padding-left: 48%"
    ><v-progress-circular v-if="!fixture" indeterminate color="primary"></v-progress-circular
  ></v-col>
  <v-form v-model="valid" v-if="fixture">
    <v-col>
      <SimpleFixtures :fixtures="[fixtureDoc]" inline-details />
      <div v-if="!fixture.result">
        <v-text-field
          v-model.number="result.homeScore"
          :rules="[required('Home Score')]"
          :label="teamLabel(fixture.home)"
          type="number"
        ></v-text-field>
        <v-text-field
          v-model.number="result.awayScore"
          :rules="[required('Away Score')]"
          :label="teamLabel(fixture.away)"
          type="number"
        ></v-text-field>
      </div>

      <v-textarea v-model="reportText" outline auto-grow label="Match Report">
        <template v-slot:append
          ><v-tooltip top
            ><template v-slot:activator="{ props }"
              ><v-btn v-on="props" small flat @click="preview = !preview"
                ><v-icon color="light-blue">mdi-eye-outline</v-icon></v-btn
              ></template
            ><span>Preview</span></v-tooltip
          ></template
        >
      </v-textarea>
      <div v-if="fixtureForSubmission && user">
        <v-btn
          v-on:click="
            () => {
              fixtureForSubmission &&
                user?.siteUser?.user?.id &&
                preSubmit(fixtureForSubmission, user?.siteUser?.user?.id, reportText)
            }
          "
          color="primary"
          :disabled="!valid"
          append-icon="mdi-send"
          >Submit</v-btn
        >
      </div>
      <transition name="fade">
        <v-card v-if="preview">
          <v-card-title
            ><v-icon color="light-blue">mdi-eye-outline</v-icon>
            <div class="light-blue--text pl-1">Preview</div>
          </v-card-title>
          <v-card-text>
            <QlMarkdown :text="reportText ? reportText : ''" />
          </v-card-text>
        </v-card>
      </transition>

      <v-dialog v-model="confirm" persistent max-width="60%" v-bind="dialogSize">
        <v-card>
          <v-card-title>Check Results</v-card-title>
          <v-card-text>
            <table v-if="fixtureForSubmission">
              <FixtureLine :fixture="fixtureForSubmission" inline-details />
            </table>
          </v-card-text>
          <v-card-actions>
            <v-btn v-on:click="confirm = false"> <v-icon left>mdi-cancel</v-icon>Cancel</v-btn>
            <v-btn v-if="fixtureForSubmission && user" color="primary" v-on:click="submit"
              >Submit</v-btn
            >
          </v-card-actions>
        </v-card>
      </v-dialog>
    </v-col>
  </v-form>
</template>
<script setup lang="ts">
import { Result, type Fixture } from '@/entity/Fixtures'
import type { DocumentReference } from 'firebase/firestore'
import { ref } from 'vue'
import { useDocument } from 'vuefire'
import SimpleFixtures from '../fixtures/SimpleFixtures.vue'
import { useValidations } from '../Validation'
import QlMarkdown from '../text/QlMarkdown.vue'
import FixtureLine from '../fixtures/FixtureLine.vue'
import { useFixture } from '@/services/FixtureService'
import { useUserStore } from '@/stores/app'

const { fixtureDoc } = defineProps<{ fixtureDoc: DocumentReference<Fixture> }>()
const { submitResult } = useFixture()

const { required } = useValidations()

const fixture = useDocument(fixtureDoc)
const fixtureForSubmission = useDocument(fixtureDoc, { maxRefDepth: 0 })
const result = ref(new Result(0, 0))
const valid = ref(false)
const preview = ref(false)
const confirm = ref(false)
const reportText = ref('')
const dialogSize = {}
const { user } = useUserStore()

const teamLabel = (team: Fixture['home']) => team.id

const preSubmit = (fixture: Fixture, userId: string, reportText?: string) => {
  if (fixture.result) {
    submit(fixture, userId, reportText)
  } else {
    const fixtureInFlight = { ...fixture }
    fixtureInFlight.result = result.value
    fixtureForSubmission.value = fixtureInFlight
    confirm.value = true
  }
}

const submit = (fixture: Fixture, userId: string, reportText?: string) => {
  submitResult(fixture.id, userId, fixture.result, reportText)
}
</script>
