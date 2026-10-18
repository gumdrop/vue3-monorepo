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
            <div class="text-subtitle-2 font-weight-medium mb-2">
              {{ store.fixture.homeName }} players (3–4)
            </div>
            <v-combobox
              v-for="index in 4"
              :key="`home-${index}`"
              v-model="homePlayers[index - 1]"
              :items="homeMemberNames"
              :label="`Player ${index}`"
              class="mb-2"
              clearable
              hide-details
            />
          </v-col>
          <v-col cols="12" sm="6">
            <div class="text-subtitle-2 font-weight-medium mb-2">
              {{ store.fixture.awayName }} players (3–4)
            </div>
            <v-combobox
              v-for="index in 4"
              :key="`away-${index}`"
              v-model="awayPlayers[index - 1]"
              :items="awayMemberNames"
              :label="`Player ${index}`"
              class="mb-2"
              clearable
              hide-details
            />
          </v-col>
        </v-row>

        <v-alert
          v-if="store.fixture && (homePlayerCount < 3 || awayPlayerCount < 3)"
          type="warning"
          density="compact"
          class="mb-4"
        >
          Each team must have at least 3 players.
        </v-alert>

        <v-btn color="primary" :disabled="!canContinue" @click="continueToReview">
          Review questions
        </v-btn>
      </template>
    </v-card-text>
  </v-card>
</template>
<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { parseParent } from '@quizleague/shared'
import FixturesDAO, { fixtureDAO } from '@/dao/FixturesDAO'
import TeamDAO from '@/dao/TeamDAO'
import TeamMemberDAO from '@/dao/TeamMemberDAO'
import UserDAO from '@/dao/UserDAO'
import { useDateTime } from '@/services/DateService'
import { useFixture } from '@/services/FixtureService'
import { useUserStore } from '@/stores/app'
import { useQuizmasterStore } from '@/stores/quizmaster'

const emit = defineEmits<{ done: [] }>()

const store = useQuizmasterStore()
const password = ref('')
const homeIsAFirstHalf = ref(true)
const homePlayers = ref<string[]>(['', '', '', ''])
const awayPlayers = ref<string[]>(['', '', '', ''])
const homeMemberNames = ref<string[]>([])
const awayMemberNames = ref<string[]>([])

const { fixturesForResultSubmission } = useFixture()
const { user } = storeToRefs(useUserStore())
const { date } = useDateTime()

const fixtureLabel = computed(() =>
  store.fixture?.date ? date(store.fixture.date, 'd MMMM yyyy') ?? store.fixture.date : '',
)

const homePlayerCount = computed(() => homePlayers.value.filter((p) => p.trim()).length)
const awayPlayerCount = computed(() => awayPlayers.value.filter((p) => p.trim()).length)

const canContinue = computed(
  () => Boolean(store.fixture) && homePlayerCount.value >= 3 && awayPlayerCount.value >= 3,
)

watch(
  () => store.fixture,
  async (fixture) => {
    if (!fixture) {
      homeMemberNames.value = []
      awayMemberNames.value = []
      return
    }

    homeMemberNames.value = await teamMemberNames(fixture.homeId)
    awayMemberNames.value = await teamMemberNames(fixture.awayId)
  },
)

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
    homeId: fixture.home.id,
    awayId: fixture.away.id,
  }
})

async function teamMemberNames(teamId: string): Promise<string[]> {
  const member = await TeamMemberDAO.getDataForTeam(`team/${teamId}`)
  const refs = member?.users ?? []

  const names: string[] = []
  for (const ref of refs) {
    const teamUser = await UserDAO.getDataById(ref.id)
    if (teamUser?.name?.trim()) names.push(teamUser.name)
  }
  return names
}

async function acquire() {
  if (!store.fixture?.date || !password.value) return
  await store.acquire(store.fixture.date, password.value)
}

function continueToReview() {
  store.homeIsAFirstHalf = homeIsAFirstHalf.value
  store.homePlayers = homePlayers.value.map((p) => p.trim()).filter(Boolean)
  store.awayPlayers = awayPlayers.value.map((p) => p.trim()).filter(Boolean)
  emit('done')
}
</script>
