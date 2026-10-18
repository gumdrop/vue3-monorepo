<template>
  <v-card class="mt-4">
    <v-card-title>Submit result</v-card-title>
    <v-card-text>
      <div class="text-h5 mb-2">
        {{ store.fixture?.homeName }} {{ store.score.home }} — {{ store.score.away }}
        {{ store.fixture?.awayName }}
      </div>
      <div class="text-subtitle-1 text-medium-emphasis mb-4">
        Beer round: {{ store.beerRoundScore.home }} — {{ store.beerRoundScore.away }}
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

      <div class="mt-4">
        <v-btn variant="text" :disabled="store.submitted" @click="emit('back')">Back</v-btn>
      </div>
    </v-card-text>
  </v-card>
</template>
<script setup lang="ts">
import { ref } from 'vue'
import { useQuizmasterStore } from '@/stores/quizmaster'

const emit = defineEmits<{ back: [] }>()
const store = useQuizmasterStore()
const generating = ref(false)

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
.report-text {
  white-space: pre-wrap;
}
</style>
