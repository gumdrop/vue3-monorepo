<template>
  <v-card class="mt-4">
    <v-card-title>Review questions</v-card-title>
    <v-card-text>
      <p v-if="!store.quiz" class="text-medium-emphasis">No quiz loaded.</p>

      <v-expansion-panels v-else>
        <v-expansion-panel v-for="(round, index) in store.quiz.rounds" :key="index">
          <v-expansion-panel-title>
            {{ round.round }}
            <span v-if="round.subjects" class="text-caption ml-2">
              (subjects: {{ round.subjects.join(', ') }})
            </span>
          </v-expansion-panel-title>
          <v-expansion-panel-text>
            <v-list density="compact">
              <v-list-item v-for="(question, qIndex) in round.questions" :key="qIndex">
                <v-list-item-title>
                  {{ question.number }}. {{ question.question }}
                </v-list-item-title>
                <v-list-item-subtitle>Answer: {{ question.answer }}</v-list-item-subtitle>
              </v-list-item>
            </v-list>
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>

      <div class="d-flex justify-space-between mt-4">
        <v-btn variant="text" @click="emit('back')">Back</v-btn>
        <v-btn color="primary" :disabled="!store.quiz" @click="emit('start')">Start match</v-btn>
      </div>
    </v-card-text>
  </v-card>
</template>
<script setup lang="ts">
import { useQuizmasterStore } from '@/stores/quizmaster'

const emit = defineEmits<{ back: []; start: [] }>()
const store = useQuizmasterStore()
</script>
