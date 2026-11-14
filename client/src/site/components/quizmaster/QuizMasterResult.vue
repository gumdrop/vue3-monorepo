<template>
  <v-card class="mt-4 result-card">
    <v-card-title class="d-flex align-center ga-2">
      <v-icon icon="mdi-flag-checkered" color="primary" />
      Submit result
    </v-card-title>
    <v-card-text>
      <div class="result-scoreboard">
        <div class="result-team">
          <ResponsiveTeamName v-if="homeTeam" :team="homeTeam" />
          <template v-else>{{ teamNames.home }}</template>
        </div>
        <div class="result-score score-display">
          {{ displayScore.home }} — {{ displayScore.away }}
        </div>
        <div class="result-team">
          <ResponsiveTeamName v-if="awayTeam" :team="awayTeam" />
          <template v-else>{{ teamNames.away }}</template>
        </div>
      </div>
      <div class="result-beer">
        <v-icon icon="mdi-glass-mug-variant" size="18" class="mr-1" />
        Beer round: {{ displayBeer.home }} — {{ displayBeer.away }}
      </div>

      <v-btn
        color="primary"
        size="large"
        prepend-icon="mdi-file-document-outline"
        :loading="generating"
        :disabled="store.submitted"
        @click="generate"
      >
        Generate match report
      </v-btn>

      <v-alert v-if="store.report" type="info" class="mt-4">
        <div class="text-subtitle-2 mb-2">Generated match report</div>
        <div class="report-text">{{ store.report.text }}</div>
      </v-alert>

      <v-btn
        v-if="store.report"
        color="success"
        size="large"
        prepend-icon="mdi-check-bold"
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

      <div class="mt-4">
        <v-btn
          variant="text"
          prepend-icon="mdi-arrow-left"
          :disabled="store.submitted"
          @click="emit('back')"
        >
          Back
        </v-btn>
      </div>
    </v-card-text>
  </v-card>
</template>
<script setup lang="ts">
import { computed, ref } from 'vue'
import { useQuizmasterStore } from '@/stores/quizmaster'
import ResponsiveTeamName from '../common/ResponsiveTeamName.vue'

const emit = defineEmits<{ back: [] }>()
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
</script>
<style scoped>
.result-card {
  max-width: 880px;
}

.result-scoreboard {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 10px;
}

.result-team {
  font-weight: 600;
  font-size: 1.05rem;
  max-width: 220px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.result-score {
  font-size: 2.5rem;
  line-height: 1;
  font-weight: 700;
  padding: 8px 24px;
  border-radius: 16px;
  background: rgba(var(--v-theme-primary), 0.08);
  color: rgb(var(--v-theme-primary));
}

.result-beer {
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(var(--v-theme-on-surface), 0.7);
  font-size: 0.95rem;
  margin-bottom: 24px;
}

.report-text {
  white-space: pre-wrap;
}

@media (max-width: 600px) {
  .result-score {
    font-size: 1.8rem;
    padding: 6px 16px;
  }
}
</style>
