<template>
  <v-card class="mt-4">
    <v-card-title>Match setup</v-card-title>
    <v-card-text>
      <v-alert v-if="store.fixture" type="info" density="compact" class="mb-4">
        <strong>Fixture:</strong> {{ fixtureLabel }} —
        {{ store.fixture.homeName }} (home) vs {{ store.fixture.awayName }} (away)
      </v-alert>
      <v-alert v-else type="warning" density="compact" class="mb-4">
        No fixture found for your team.
      </v-alert>

      <v-text-field
        v-model="password"
        label="Quiz PDF password"
        :disabled="store.acquiring || !store.fixture"
      />

      <div class="d-flex ga-2 mb-4">
        <v-btn
          color="primary"
          :loading="store.acquiring"
          :disabled="!store.fixture || !password"
          @click="acquire"
        >
          Acquire quiz
        </v-btn>
        <v-alert v-if="store.acquireError" type="error" density="compact" class="mb-0">
          {{ store.acquireError }}
        </v-alert>
      </div>

      <template v-if="store.quiz">
        <v-divider class="my-4" />

        <v-radio-group v-model="homeIsAFirstHalf" label="Which team is the A team for the first half?">
          <v-radio :value="true" label="Home" />
          <v-radio :value="false" label="Away" />
        </v-radio-group>

        <v-row>
          <v-col cols="12" sm="6">
            <v-text-field v-model="homePlayersText" label="Home players (comma-separated)" />
          </v-col>
          <v-col cols="12" sm="6">
            <v-text-field v-model="awayPlayersText" label="Away players (comma-separated)" />
          </v-col>
        </v-row>

        <v-btn color="primary" :disabled="!canContinue" @click="continueToReview">
          Review questions
        </v-btn>
      </template>
    </v-card-text>
  </v-card>
</template>
<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { parseParent } from '@quizleague/shared'
import FixturesDAO, { fixtureDAO } from '@/dao/FixturesDAO'
import TeamDAO from '@/dao/TeamDAO'
import { useDateTime } from '@/services/DateService'
import { useFixture } from '@/services/FixtureService'
import { useUserStore } from '@/stores/app'
import { useQuizmasterStore } from '@/stores/quizmaster'

const emit = defineEmits<{ done: [] }>()

const store = useQuizmasterStore()
const password = ref('')
const homeIsAFirstHalf = ref(true)
const homePlayersText = ref('')
const awayPlayersText = ref('')

const { fixturesForResultSubmission } = useFixture()
const { user } = storeToRefs(useUserStore())
const { date } = useDateTime()

const fixtureLabel = computed(() =>
  store.fixture?.date ? date(store.fixture.date, 'd MMMM yyyy') ?? store.fixture.date : '',
)

const canContinue = computed(() => Boolean(store.fixture))

onMounted(async () => {
  const team = user.value?.team
  if (!team) return

  const fixtureRefs = await fixturesForResultSubmission(team.id)
  const fixtureRef = fixtureRefs[0]
  if (!fixtureRef) return

  const fixture = await fixtureDAO.getDataByPath(fixtureRef.path)
  if (!fixture) return

  const parent = await FixturesDAO.getDataByPath(parseParent(fixture.path))
  const homeTeam = await TeamDAO.getDataById(fixture.home.id)
  const awayTeam = await TeamDAO.getDataById(fixture.away.id)

  store.fixture = {
    path: fixture.path,
    date: parent?.date ?? '',
    homeName: homeTeam?.name ?? '',
    awayName: awayTeam?.name ?? '',
  }
})

async function acquire() {
  if (!store.fixture?.date || !password.value) return
  await store.acquire(store.fixture.date, password.value)
}

function continueToReview() {
  store.homeIsAFirstHalf = homeIsAFirstHalf.value
  store.homePlayers = splitNames(homePlayersText.value)
  store.awayPlayers = splitNames(awayPlayersText.value)
  emit('done')
}

function splitNames(text: string): string[] {
  return text
    .split(',')
    .map((name) => name.trim())
    .filter(Boolean)
}
</script>
