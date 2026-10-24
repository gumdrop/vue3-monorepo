<template>
  <v-card class="mt-4">
    <v-card-title>Submit result</v-card-title>
    <v-card-text>
      <div class="text-h5 mb-2">
        {{ teamNames.home }} {{ displayScore.home }} — {{ displayScore.away }} {{ teamNames.away }}
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

const emit = defineEmits<{ back: []; restart: [] }>()
const store = useQuizmasterStore()
const generating = ref(false)

const teamNames = computed(() => ({
  home: store.fixture?.homeName ?? 'Home',
  away: store.fixture?.awayName ?? 'Away',
}))
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
.report-text {
  white-space: pre-wrap;
}
</style>
