<template>
  <v-card class="mt-4">
    <v-card-title>Submit result</v-card-title>
    <v-card-text>
      <div class="score-line text-h5 mb-2">
        <ResponsiveTeamName v-if="homeTeam" :team="homeTeam" />
        <template v-else>{{ teamNames.home }}</template>
        {{ displayScore.home }} — {{ displayScore.away }}
        <ResponsiveTeamName v-if="awayTeam" :team="awayTeam" />
        <template v-else>{{ teamNames.away }}</template>
      </div>
      <div class="text-subtitle-1 text-medium-emphasis mb-4">
        Beer round: {{ displayBeer.home }} — {{ displayBeer.away }}
      </div>

      <v-btn color="primary" :loading="generating" :disabled="store.submitted" @click="generate">
        Generate match report
      </v-btn>

      <v-alert v-if="store.report" type="info" class="mt-4">
        <div class="text-subtitle-2 mb-2">Generated match report</div>
        <div class="report-text">{{ store.report.text }}</div>
      </v-alert>

      <v-btn
        v-if="store.report"
        color="success"
        class="mt-4"
        :loading="store.submitting"
        :disabled="store.submitted"
        @click="submit"
      >
        Submit result
      </v-btn>

      <v-alert v-if="store.submitted" type="success" class="mt-4">
        Result submitted successfully.
      </v-alert>
      <v-alert v-if="store.submitError" type="error" class="mt-4">
        {{ store.submitError }}
      </v-alert>

      <div class="mt-4 d-flex ga-2">
        <v-btn variant="text" :disabled="store.submitted" @click="emit('back')">Back</v-btn>
        <v-btn v-if="store.submitted" color="primary" @click="restart">Run another match</v-btn>
      </div>
    </v-card-text>
  </v-card>
</template>
<script setup lang="ts">
import { computed, ref } from 'vue'
import { useQuizmasterStore } from '@/stores/quizmaster'
import ResponsiveTeamName from '../common/ResponsiveTeamName.vue'

const emit = defineEmits<{ back: []; restart: [] }>()
const store = useQuizmasterStore()
const generating = ref(false)

const teamNames = computed(() => ({
  home: store.fixture?.homeName ?? 'Home',
  away: store.fixture?.awayName ?? 'Away',
}))
const homeTeam = computed(() => store.fixture?.homeTeam)
const awayTeam = computed(() => store.fixture?.awayTeam)
const displayScore = computed(() => store.submittedScore ?? store.submissionScore)
const displayBeer = computed(() => store.submittedBeerRoundScore ?? store.beerRoundScore)

async function generate() {
  generating.value = true
  try {
    await store.generateReport()
  } finally {
    generating.value = false
  }
}

async function submit() {
  await store.submit()
}

function restart() {
  store.reset()
  emit('restart')
}
</script>
<style scoped>
.score-line {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0.5ch;
}

.report-text {
  white-space: pre-wrap;
}
</style>
