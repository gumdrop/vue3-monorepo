<template>
  <v-card class="mt-4 review-card">
    <v-card-title class="d-flex align-center ga-2">
      <v-icon icon="mdi-clipboard-text-outline" color="primary" />
      Review questions
    </v-card-title>
    <v-card-text>
      <p v-if="!store.quiz" class="text-medium-emphasis">No quiz loaded.</p>

      <v-expansion-panels v-else variant="accordion">
        <v-expansion-panel
          v-for="(round, index) in store.quiz.rounds"
          :key="index"
          class="review-round"
        >
          <v-expansion-panel-title>
            <span class="review-round-title">
              {{ round.round }}
              <span v-if="round.subjects" class="review-subjects">
                subjects: {{ round.subjects.join(', ') }}
              </span>
            </span>
          </v-expansion-panel-title>
          <v-expansion-panel-text>
            <v-list density="compact" class="review-question-list">
              <v-list-item
                v-for="(question, qIndex) in round.questions"
                :key="qIndex"
                class="review-question"
              >
                <v-list-item-title class="text-wrap">
                  <span class="review-question-number">{{ question.number }}</span>
                  {{ question.question }}
                </v-list-item-title>
                <v-list-item-subtitle class="review-answer">
                  Answer: <span v-html="underlineHtml(question.answer)" />
                </v-list-item-subtitle>
              </v-list-item>
            </v-list>
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>

      <div class="review-footer">
        <v-btn variant="text" prepend-icon="mdi-arrow-left" @click="emit('back')">Back</v-btn>
        <v-btn
          color="primary"
          size="large"
          prepend-icon="mdi-play"
          :disabled="!store.quiz"
          @click="emit('start')"
        >
          Start match
        </v-btn>
      </div>
    </v-card-text>
  </v-card>
</template>
<script setup lang="ts">
import { useQuizmasterStore } from '@/stores/quizmaster'
import { underlineHtml } from '@/utils/underlines'

const emit = defineEmits<{ back: []; start: [] }>()
const store = useQuizmasterStore()
</script>
<style scoped>
.review-card {
  max-width: 880px;
}

.review-round-title {
  font-weight: 600;
}

.review-subjects {
  margin-left: 8px;
  font-size: 0.8rem;
  font-weight: 500;
  color: rgba(var(--v-theme-on-surface), 0.6);
}

.review-question {
  align-items: flex-start;
  padding-top: 8px;
  padding-bottom: 8px;
}

.review-question-number {
  display: inline-block;
  min-width: 2.4em;
  font-weight: 700;
  color: rgb(var(--v-theme-primary));
}

.review-answer {
  margin-top: 2px;
}

.review-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 20px;
  gap: 8px;
  flex-wrap: wrap;
}
</style>
