<template>
  <v-container fluid class="pa-0" :class="gridSize">
    <v-row no-gutters v-if="fixtures && fixtures.length > 0">
      <v-col cols="12">
        <div class="submission-container">
          <SubmitResult v-for="fixture in fixtures" :fixture-doc="fixture" :key="fixture.id" />
        </div>
      </v-col>
    </v-row>
    <v-row v-else-if="fixtures && fixtures.length === 0">
      <v-col cols="12">
        <v-card class="pa-8 text-center bg-grey-lighten-4 rounded-xl">
          <v-icon size="64" color="grey-lighten-1" class="mb-4">mdi-check-all</v-icon>
          <div class="text-h6 font-weight-bold grey--text text--darken-2">No pending results to submit</div>
          <p class="text-body-1 grey--text">You're all caught up!</p>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>
<script setup lang="ts">
import { useFixture } from '@/services/FixtureService'
import { usePromise } from '@/utils/PromiseRef'
import SubmitResult from './SubmitResult.vue'
import { useLayout } from '@/services/LayoutService'
import { useUserStore } from '@/stores/app'
import { storeToRefs } from 'pinia'

const { fixturesForResultSubmission } = useFixture()
const { gridSize } = useLayout()

const { user } = storeToRefs(useUserStore())

const fixtures = usePromise(() => fixturesForResultSubmission(user.value?.team.id))
</script>
<style scoped>
.submission-container {
  display: flex;
  flex-direction: column;
  gap: 24px;
}
</style>
