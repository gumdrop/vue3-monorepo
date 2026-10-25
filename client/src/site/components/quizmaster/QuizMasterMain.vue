<template>
  <v-container class="pa-0">
    <template v-if="user">
      <v-row>
        <v-col cols="12">
          <v-card>
            <v-card-title>Question Master</v-card-title>
            <v-card-subtitle>Experimental — run a match and submit the result</v-card-subtitle>
          </v-card>
        </v-col>
      </v-row>

      <QuizMasterSetup v-if="step === 1" @done="goTo(2)" @resume="onResume" />
      <QuizMasterReview v-else-if="step === 2" @back="goTo(1)" @start="goTo(3)" />
      <QuizMasterMatch v-else-if="step === 3" @back="goTo(2)" @done="goTo(4)" />
      <QuizMasterResult v-else @back="goTo(3)" @restart="goTo(1)" />
    </template>

    <v-row v-else class="justify-center mt-8 align-center">
      <v-progress-circular indeterminate size="20" width="2" />
      <span class="ml-2 text-medium-emphasis">Signing in…</span>
    </v-row>
  </v-container>
</template>
<script setup lang="ts">
import { computed, ref } from 'vue'
import { useSideMenuStore, useUserStore } from '@/stores/app'
import { useQuizmasterStore } from '@/stores/quizmaster'
import QuizMasterSetup from './QuizMasterSetup.vue'
import QuizMasterReview from './QuizMasterReview.vue'
import QuizMasterMatch from './QuizMasterMatch.vue'
import QuizMasterResult from './QuizMasterResult.vue'

const step = ref(1)
const store = useQuizmasterStore()
const user = computed(() => useUserStore().user)

// The quiz-master is a focused full-width tool, so hide the left-hand section
// menu the same way the home page does.
useSideMenuStore().setSidemenu(false)

function goTo(next: 1 | 2 | 3 | 4) {
  step.value = next
  if (next !== 1) {
    store.setResumeStep(next)
  }
}

function onResume() {
  const target = store.resumeStep
  store.finishResume()
  step.value = target
}
</script>
