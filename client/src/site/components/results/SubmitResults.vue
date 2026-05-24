<template>
  <v-container fluid :class="gridSize">
    <v-col v-if="fixtures">
      <QlTextBox>
        <SubmitResult v-for="fixture in fixtures" :fixture-doc="fixture" :key="fixture.id" />
      </QlTextBox>
    </v-col>
  </v-container>
</template>
<script setup lang="ts">
import { useFixture } from '@/services/FixtureService'
import { usePromise } from '@/utils/PromiseRef'
import QlTextBox from '../text/QlTextBox.vue'
import SubmitResult from './SubmitResult.vue'
import { useLayout } from '@/services/LayoutService'
import { useUserStore } from '@/stores/app'
import { storeToRefs } from 'pinia'

const { fixturesForResultSubmission } = useFixture()
const { gridSize } = useLayout()

const { user } = storeToRefs(useUserStore())

const fixtures = usePromise(() => fixturesForResultSubmission(user.value?.team.id))
</script>
