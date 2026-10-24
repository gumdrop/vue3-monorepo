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
          <tr v-for="(subject, subjectIndex) in round.subjects" :key="subject">
            <td>{{ subject }}</td>
            <td>
              <v-select
                v-model="homeAssign[subject]"
                :items="availableCategoryPlayers(homeSelection, subjectIndex, store.homePlayers)"
                density="compact"
                clearable
                hide-details
              />
            </td>
            <td>
              <v-select
                v-model="awayAssign[subject]"
                :items="availableCategoryPlayers(awaySelection, subjectIndex, store.awayPlayers)"
                density="compact"
                clearable
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
import { availableCategoryPlayers } from '@/services/QuizPlayers'
import { useQuizmasterStore } from '@/stores/quizmaster'

const props = defineProps<{ roundIndex: number; round: QuizRound }>()
const emit = defineEmits<{ saved: [] }>()

const store = useQuizmasterStore()

const homeName = computed(() => store.fixture?.homeName ?? 'Home')
const awayName = computed(() => store.fixture?.awayName ?? 'Away')

const homeAssign = reactive<Record<string, string | null | undefined>>({})
const awayAssign = reactive<Record<string, string | null | undefined>>({})
const homeJoker = ref<string>('None')
const awayJoker = ref<string>('None')

const jokerOptions = computed(() => ['None', ...(props.round.subjects ?? [])])

const homeSelection = computed(() =>
  (props.round.subjects ?? []).map((s) => homeAssign[s] ?? ''),
)
const awaySelection = computed(() =>
  (props.round.subjects ?? []).map((s) => awayAssign[s] ?? ''),
)

// A category may be left unassigned (clearable); its questions then default to
// the opposition's contestant (see QuizMasterMatch). The round is ready once
// both jokers are set and each team has at least one contestant assigned.
const hasAnyAssignment = (assignments: Record<string, string | null | undefined>) =>
  (props.round.subjects ?? []).some((s) => (assignments[s] ?? '').trim())

const assignmentsComplete = computed(
  () =>
    hasAnyAssignment(homeAssign) &&
    hasAnyAssignment(awayAssign) &&
    homeJoker.value !== 'None' &&
    awayJoker.value !== 'None',
)

function save() {
  // Omit cleared categories so an unassigned category is truly absent from the
  // session (and resolves to "no contestant" during the match).
  const sanitize = (assignments: Record<string, string | null | undefined>) =>
    Object.fromEntries(
      (props.round.subjects ?? [])
        .map((subject): [string, string] => [subject, (assignments[subject] ?? '').trim()])
        .filter(([, name]) => Boolean(name)),
    )

  store.categoryAssignments[props.roundIndex] = {
    home: sanitize(homeAssign),
    away: sanitize(awayAssign),
  }
  store.jokers[props.roundIndex] = {
    home: homeJoker.value === 'None' ? undefined : homeJoker.value,
    away: awayJoker.value === 'None' ? undefined : awayJoker.value,
  }
  emit('saved')
}
</script>
