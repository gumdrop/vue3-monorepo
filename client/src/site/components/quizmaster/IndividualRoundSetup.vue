<template>
  <v-card class="mt-4">
    <v-card-title>Individual round — assign contestants and jokers</v-card-title>
    <v-card-text>
      <v-table v-if="round.subjects">
        <thead>
          <tr>
            <th>Category</th>
            <th>{{ homeName }} contestant</th>
            <th>{{ awayName }} contestant</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="subject in round.subjects" :key="subject">
            <td>{{ subject }}</td>
            <td>
              <v-select
                v-model="homeAssign[subject]"
                :items="store.homePlayers"
                density="compact"
                hide-details
              />
            </td>
            <td>
              <v-select
                v-model="awayAssign[subject]"
                :items="store.awayPlayers"
                density="compact"
                hide-details
              />
            </td>
          </tr>
        </tbody>
      </v-table>

      <v-row class="mt-4">
        <v-col cols="12" sm="6">
          <v-select v-model="homeJoker" :items="jokerOptions" :label="`${homeName} joker category`" />
        </v-col>
        <v-col cols="12" sm="6">
          <v-select v-model="awayJoker" :items="jokerOptions" :label="`${awayName} joker category`" />
        </v-col>
      </v-row>

      <div class="d-flex justify-end">
        <v-btn color="primary" :disabled="!assignmentsComplete" @click="save">Start round</v-btn>
      </div>
    </v-card-text>
  </v-card>
</template>
<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import type { QuizRound } from '@quizleague/shared'
import { useQuizmasterStore } from '@/stores/quizmaster'

const props = defineProps<{ roundIndex: number; round: QuizRound }>()
const emit = defineEmits<{ saved: [] }>()

const store = useQuizmasterStore()

const homeName = computed(() => store.fixture?.homeName ?? 'Home')
const awayName = computed(() => store.fixture?.awayName ?? 'Away')

const homeAssign = reactive<Record<string, string>>({})
const awayAssign = reactive<Record<string, string>>({})
const homeJoker = ref<string>('None')
const awayJoker = ref<string>('None')

const jokerOptions = computed(() => ['None', ...(props.round.subjects ?? [])])

const assignmentsComplete = computed(() => {
  const subjects = props.round.subjects ?? []
  return subjects.every((s) => homeAssign[s] && awayAssign[s])
})

function save() {
  store.categoryAssignments[props.roundIndex] = {
    home: { ...homeAssign },
    away: { ...awayAssign },
  }
  store.jokers[props.roundIndex] = {
    home: homeJoker.value === 'None' ? undefined : homeJoker.value,
    away: awayJoker.value === 'None' ? undefined : awayJoker.value,
  }
  emit('saved')
}
</script>
