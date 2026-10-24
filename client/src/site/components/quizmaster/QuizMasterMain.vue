<template>
  <v-container>
    <template v-if="user">
      <v-row>
        <v-col cols="12">
          <v-card>
            <v-card-title>Question Master</v-card-title>
            <v-card-subtitle>Experimental — run a match and submit the result</v-card-subtitle>
          </v-card>
        </v-col>
      </v-row>

      <QuizMasterSetup v-if="step === 1" @done="step = 2" />
      <QuizMasterReview v-else-if="step === 2" @back="step = 1" @start="step = 3" />
      <QuizMasterMatch v-else-if="step === 3" @back="step = 2" @done="step = 4" />
      <QuizMasterResult v-else @back="step = 3" @restart="step = 1" />
    </template>

    <v-row v-else class="justify-center mt-8 align-center">
      <v-progress-circular indeterminate size="20" width="2" />
      <span class="ml-2 text-medium-emphasis">Signing in…</span>
    </v-row>
  </v-container>
</template>
<script setup lang="ts">
import { computed, ref } from 'vue'
import { useUserStore } from '@/stores/app'
import QuizMasterSetup from './QuizMasterSetup.vue'
import QuizMasterReview from './QuizMasterReview.vue'
import QuizMasterMatch from './QuizMasterMatch.vue'
import QuizMasterResult from './QuizMasterResult.vue'

const step = ref(1)
const user = computed(() => useUserStore().user)
</script>
