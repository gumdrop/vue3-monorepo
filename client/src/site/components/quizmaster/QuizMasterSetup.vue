<template>
  <v-card class="mt-4 setup-card">
    <v-card-title class="d-flex align-center ga-2">
      <v-icon icon="mdi-tune-variant" color="primary" />
      Match setup
    </v-card-title>
    <v-card-text>
      <v-alert
        v-if="store.fixture"
        type="info"
        variant="tonal"
        icon="mdi-calendar-star"
        class="mb-4"
      >
        <strong>Fixture:</strong> {{ fixtureLabel }} — {{ store.fixture.homeName }} (home) vs
        {{ store.fixture.awayName }} (away)
      </v-alert>
      <v-alert v-else type="warning" variant="tonal" icon="mdi-alert-outline" class="mb-4">
        No fixture found for your team.
      </v-alert>
      <v-alert v-if="fixtureHasResult" type="error" density="compact" class="mb-4">
        This fixture already has a result — the quiz cannot be run.
      </v-alert>
      <v-alert v-if="store.resuming" type="info" density="compact" class="mb-4">
        A quiz is already in progress for this fixture. Re-enter the quiz password to resume where
        you left off.
      </v-alert>

      <div class="setup-section-title">
        <span class="setup-section-index">1</span> Unlock the quiz
      </div>

      <v-text-field
        v-model="password"
        label="Quiz PDF password"
        :disabled="store.acquiring || !store.fixture || fixtureHasResult"
      />

      <div v-if="isLocalhost" class="mb-2">
        <label class="text-caption text-medium-emphasis d-block mb-1">
          Override with local PDF (localhost only)
        </label>
        <input
          type="file"
          accept=".pdf,application/pdf"
          :disabled="store.acquiring || fixtureHasResult"
          @change="onFileSelected"
        />
      </div>

      <div class="d-flex ga-2 mb-4 setup-acquire-row">
        <v-btn
          color="primary"
          prepend-icon="mdi-lock-open-variant-outline"
          :loading="store.acquiring"
          :disabled="!store.fixture || !password || fixtureHasResult"
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

        <div class="setup-section-title">
          <span class="setup-section-index">2</span> Choose teams &amp; players
        </div>

        <v-radio-group
          v-model="homeIsAFirstHalf"
          label="Which team is the A team for the first half?"
        >
          <v-radio :value="true" :label="store.fixture?.homeName ?? 'Home'" />
          <v-radio :value="false" :label="store.fixture?.awayName ?? 'Away'" />
        </v-radio-group>

        <v-row>
          <v-col cols="12" sm="6">
            <div class="team-heading">
              <span class="team-heading-dot team-heading-dot--home"></span>
              {{ store.fixture?.homeName ?? 'Home' }} players
              <span class="text-medium-emphasis">(3–4)</span>
            </div>
            <v-combobox
              v-for="index in 4"
              :key="`home-${index}`"
              v-model="homePlayers[index - 1]"
              :items="availablePlayers(homePlayers, index - 1, homeMemberNames)"
              :label="`Player ${index}`"
              class="mb-2"
              clearable
              hide-details
            />
          </v-col>
          <v-col cols="12" sm="6">
            <div class="team-heading">
              <span class="team-heading-dot team-heading-dot--away"></span>
              {{ store.fixture?.awayName ?? 'Away' }} players
              <span class="text-medium-emphasis">(3–4)</span>
            </div>
            <v-combobox
              v-for="index in 4"
              :key="`away-${index}`"
              v-model="awayPlayers[index - 1]"
              :items="availablePlayers(awayPlayers, index - 1, awayMemberNames)"
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

        <v-alert v-if="saveError" type="error" density="compact" class="mb-4">
          {{ saveError }}
        </v-alert>

        <v-btn
          color="primary"
          block
          size="large"
          prepend-icon="mdi-clipboard-text-search-outline"
          :disabled="!canContinue || saving"
          :loading="saving"
          @click="continueToReview"
        >
          Review questions
        </v-btn>
      </template>
    </v-card-text>
  </v-card>
</template>
<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { parseParent, type PathAndId } from '@quizleague/shared'
import CompetitionDAO from '@/dao/CompetitionDAO'
import FixturesDAO, { fixtureDAO } from '@/dao/FixturesDAO'
import TeamDAO from '@/dao/TeamDAO'
import TeamMemberDAO from '@/dao/TeamMemberDAO'
import UserDAO from '@/dao/UserDAO'
import type User from '@/entity/User'
import { useDateTime } from '@/services/DateService'
import { useFixture } from '@/services/FixtureService'
import { availablePlayers } from '@/services/QuizPlayers'
import { useUserStore } from '@/stores/app'
import { useQuizmasterStore } from '@/stores/quizmaster'

const emit = defineEmits<{ done: []; resume: [] }>()

const store = useQuizmasterStore()
const password = ref('')
const localFile = ref<File | null>(null)
const homeIsAFirstHalf = ref<boolean>()
const homePlayers = ref<string[]>(['', '', '', ''])
const awayPlayers = ref<string[]>(['', '', '', ''])
const homeMemberNames = ref<string[]>([])
const awayMemberNames = ref<string[]>([])
const fixtureHasResult = ref(false)
const saving = ref(false)
const saveError = ref<string>()

const { fixtureForQuizmaster } = useFixture()
const { user } = storeToRefs(useUserStore())
const { date } = useDateTime()

const isLocalhost = computed(() => {
  const host = window.location.hostname
  return host === 'localhost' || host === '127.0.0.1' || host === '::1'
})

const fixtureLabel = computed(() =>
  store.fixture?.date ? (date(store.fixture.date, 'd MMMM yyyy') ?? store.fixture.date) : '',
)

const homePlayerCount = computed(() => homePlayers.value.filter((p) => (p ?? '').trim()).length)
const awayPlayerCount = computed(() => awayPlayers.value.filter((p) => (p ?? '').trim()).length)

const canContinue = computed(
  () =>
    Boolean(store.fixture) &&
    homeIsAFirstHalf.value !== undefined &&
    homePlayerCount.value >= 3 &&
    awayPlayerCount.value >= 3,
)

watch(
  () => store.fixture,
  async (fixture) => {
    if (!fixture) {
      homeMemberNames.value = []
      awayMemberNames.value = []
      return
    }

    const home = await teamMembers(fixture.homeId)
    const away = await teamMembers(fixture.awayId)
    homeMemberNames.value = home.names
    awayMemberNames.value = away.names
  },
)

onMounted(async () => {
  const team = user.value?.team
  if (!team) return

  const fixtureRefs = await fixtureForQuizmaster(team.id)
  const fixtureRef = fixtureRefs[0]
  if (!fixtureRef) return

  const fixture = await fixtureDAO.getDataByPath(fixtureRef.path)
  if (!fixture) return

  if (fixture.result) {
    fixtureHasResult.value = true
  }

  const parent = await FixturesDAO.getDataByPath(parseParent(fixture.path))
  const homeTeam = await TeamDAO.getDataById(fixture.home.id)
  const awayTeam = await TeamDAO.getDataById(fixture.away.id)
  const competition = await CompetitionDAO.getDataByPath(parseParent(parseParent(fixture.path)))

  store.fixture = {
    path: fixture.path,
    date: parent?.date ?? '',
    homeName: homeTeam?.name ?? '',
    awayName: awayTeam?.name ?? '',
    homeId: fixture.home.id,
    awayId: fixture.away.id,
    isCup: competition?._name === 'cup',
    homeTeam,
    awayTeam,
  }

  if (!fixtureHasResult.value) {
    const restored = await store.restoreSession()
    if (restored) {
      homePlayers.value = [...store.homePlayers, '', '', '', ''].slice(0, 4)
      awayPlayers.value = [...store.awayPlayers, '', '', '', ''].slice(0, 4)
      homeIsAFirstHalf.value = store.homeIsAFirstHalf
    }
  }
})

async function teamMembers(teamId: string): Promise<{ names: string[]; users: PathAndId<User>[] }> {
  const member = await TeamMemberDAO.getDataForTeam(`team/${teamId}`)
  const users = member?.users ?? []

  const names: string[] = []
  for (const ref of users) {
    const teamUser = await UserDAO.getDataById(ref.id)
    if (teamUser?.name?.trim() && !teamUser.retired) names.push(teamUser.name)
  }
  return { names, users }
}

async function acquire() {
  if (!store.fixture?.date || !password.value) return

  const pdfBase64 = localFile.value ? await readFileAsBase64(localFile.value) : undefined
  const ok = await store.acquire(store.fixture.date, password.value, pdfBase64)
  if (ok && store.resuming) {
    emit('resume')
  }
}

function onFileSelected(event: Event) {
  const input = event.target as HTMLInputElement
  localFile.value = input.files?.[0] ?? null
}

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result as string
      resolve(dataUrl.split(',')[1] ?? '')
    }
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}

async function continueToReview() {
  const fixture = store.fixture
  if (!fixture) return

  const firstHalfIsHome = homeIsAFirstHalf.value
  if (firstHalfIsHome === undefined) return

  store.homeIsAFirstHalf = firstHalfIsHome
  const home = homePlayers.value.map((p) => (p ?? '').trim()).filter(Boolean)
  const away = awayPlayers.value.map((p) => (p ?? '').trim()).filter(Boolean)

  saving.value = true
  saveError.value = undefined
  try {
    await saveAdhocPlayers(fixture.homeId, home)
    await saveAdhocPlayers(fixture.awayId, away)
  } catch (error) {
    saveError.value = `Could not save players: ${errorMessage(error)}`
    return
  } finally {
    saving.value = false
  }

  store.homePlayers = home
  store.awayPlayers = away
  emit('done')
}

async function saveAdhocPlayers(teamId: string, players: string[]) {
  const { names, users } = await teamMembers(teamId)
  const existingNames = new Set(names.map((name) => name.trim().toLowerCase()))
  const newUsers: User[] = []
  const seen = new Set<string>()

  for (const player of players) {
    const key = player.trim().toLowerCase()
    if (!key || existingNames.has(key) || seen.has(key)) continue
    seen.add(key)

    const user = UserDAO.newInstance()
    user.name = player.trim()
    user.email = 'placeholder@dummy.com'
    user.placeholder = true
    newUsers.push(user)
  }

  if (newUsers.length === 0) return

  await Promise.all(newUsers.map((user) => UserDAO.save(user)))
  await TeamMemberDAO.saveForTeam(`team/${teamId}`, [
    ...users,
    ...newUsers.map((user) => ({ id: user.id, path: user.path })),
  ])
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}
</script>
<style scoped>
.setup-card {
  max-width: 880px;
}

.setup-section-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-family: 'Montserrat', sans-serif;
  font-weight: 700;
  font-size: 1.05rem;
  letter-spacing: -0.01em;
  margin-bottom: 14px;
}

.setup-section-index {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: rgb(var(--v-theme-primary));
  color: rgb(var(--v-theme-on-primary));
  font-size: 0.85rem;
  font-weight: 700;
  flex: 0 0 auto;
}

.setup-acquire-row {
  align-items: center;
}

.team-heading {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  margin-bottom: 10px;
  font-size: 0.95rem;
}

.team-heading-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  flex: 0 0 auto;
}

.team-heading-dot--home {
  background: rgb(var(--v-theme-primary));
}

.team-heading-dot--away {
  background: rgb(var(--v-theme-secondary));
}

@media (max-width: 600px) {
  .setup-card {
    max-width: none;
  }
}
</style>
