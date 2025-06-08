<template>
  <div>
    <v-lazy>
      <v-slide-y-transition hide-on-leave>
        <div v-if="list">
          <table>
            <FixtureLineWrapper v-for="fixture in list" :key="fixture.id" :fixtureDoc="fixture"
              :inlineDetails="inlineDetails" />
          </table>
        </div>
      </v-slide-y-transition>
    </v-lazy>
  </div>
</template>
<script setup lang="ts">
import type { Fixture } from '@/entity/Fixtures';
import type { DocumentReference } from 'firebase/firestore';
import { computed } from 'vue';
import FixtureLineWrapper from './FixtureLineWrapper.vue';

const props = defineProps<{
  fixtures: DocumentReference<Fixture>[],
  inlineDetails?: boolean,
}>()

const list = computed(() => props.fixtures)

</script>
