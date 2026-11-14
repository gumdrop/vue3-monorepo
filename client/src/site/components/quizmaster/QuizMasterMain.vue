<template>
  <v-container class="pa-0 quizmaster-container">
    <template v-if="user">
      <v-card class="quiz-header-card mb-4" color="primary" variant="tonal" border>
        <v-card-text class="pa-4">
          <div class="quiz-header">
            <v-avatar color="primary" size="48" class="quiz-header-avatar">
              <v-icon size="28" icon="mdi-comment-question-outline" />
            </v-avatar>
            <div class="quiz-header-copy">
              <div class="quiz-header-title">Question Master</div>
              <div class="quiz-header-subtitle">
                Experimental — run a match and submit the result
              </div>
            </div>
          </div>

          <div class="quiz-steps mt-4" role="list" aria-label="Quiz progress">
            <div
              v-for="(s, index) in steps"
              :key="s.title"
              class="quiz-step"
              role="listitem"
              :class="{
                'quiz-step--active': step === index + 1,
                'quiz-step--done': step > index + 1,
              }"
            >
              <span class="quiz-step-dot">
                <v-icon v-if="step > index + 1" icon="mdi-check" size="14" />
                <span v-else>{{ index + 1 }}</span>
              </span>
              <span class="quiz-step-label">{{ s.title }}</span>
            </div>
          </div>
        </v-card-text>
      </v-card>

      <QuizMasterSetup v-if="step === 1" @done="goTo(2)" @resume="onResume" />
      <QuizMasterReview v-else-if="step === 2" @back="goTo(1)" @start="goTo(3)" />
      <QuizMasterMatch v-else-if="step === 3" @back="goTo(2)" @done="goTo(4)" />
      <QuizMasterResult v-else @back="goTo(3)" />
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

const steps = [
  { title: 'Setup' },
  { title: 'Review' },
  { title: 'Match' },
  { title: 'Result' },
]

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
<style scoped>
.quizmaster-container {
  max-width: 1200px;
}

.quiz-header {
  display: flex;
  align-items: center;
  gap: 16px;
}

.quiz-header-avatar {
  flex: 0 0 auto;
  box-shadow: 0 6px 16px rgba(var(--v-theme-primary), 0.35);
}

.quiz-header-title {
  font-family: 'Montserrat', sans-serif;
  font-weight: 700;
  font-size: 1.5rem;
  letter-spacing: -0.02em;
  line-height: 1.2;
}

.quiz-header-subtitle {
  color: rgba(var(--v-theme-on-surface), 0.7);
  font-size: 0.95rem;
  margin-top: 2px;
}

.quiz-steps {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 24px;
  align-items: center;
}

.quiz-step {
  display: flex;
  align-items: center;
  gap: 8px;
  color: rgba(var(--v-theme-on-surface), 0.55);
  font-size: 0.9rem;
  font-weight: 500;
}

.quiz-step-dot {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  border: 2px solid rgba(var(--v-theme-on-surface), 0.35);
  font-size: 0.8rem;
  font-weight: 700;
  flex: 0 0 auto;
}

.quiz-step--active {
  color: rgb(var(--v-theme-primary));
  font-weight: 700;
}

.quiz-step--active .quiz-step-dot {
  border-color: rgb(var(--v-theme-primary));
  background: rgb(var(--v-theme-primary));
  color: rgb(var(--v-theme-on-primary));
}

.quiz-step--done {
  color: rgb(var(--v-theme-success));
}

.quiz-step--done .quiz-step-dot {
  border-color: rgb(var(--v-theme-success));
  background: rgb(var(--v-theme-success));
  color: rgb(var(--v-theme-on-success));
}

@media (max-width: 600px) {
  .quiz-header-title {
    font-size: 1.25rem;
  }

  .quiz-steps {
    gap: 6px 16px;
  }
}
</style>
