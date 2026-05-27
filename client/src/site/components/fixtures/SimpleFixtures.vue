<template>
  <div class="fixtures-list-container">
    <v-lazy>
      <v-slide-y-transition hide-on-leave>
        <div v-if="list" class="fixtures-table-wrapper">
          <table class="fixtures-table">
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
<style scoped>
.fixtures-list-container {
  width: 100%;
}

.fixtures-table-wrapper {
  overflow-x: auto;
}

.fixtures-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
}

@media (max-width: 600px) {
  .fixtures-table {
    table-layout: auto;
  }
}
</style>
