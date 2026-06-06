<template>
  <div class="fixtures-list-container">
    <v-lazy>
      <div v-if="list" class="fixtures-table-wrapper">
        <table class="fixtures-table">
          <colgroup>
            <col v-if="inlineDetails" class="details-column" />
            <col class="team-column" />
            <col class="score-column" />
            <col class="team-column" />
            <col class="actions-column" />
          </colgroup>
          <FixtureLineWrapper v-for="fixture in list" :key="fixture.id" :fixtureDoc="fixture"
            :inlineDetails="inlineDetails" />
        </table>
      </div>
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

.details-column {
  width: 136px;
}

.score-column {
  width: 112px;
}

.actions-column {
  width: 80px;
}

@media (max-width: 600px) {
  .fixtures-table {
    table-layout: auto;
  }

  .score-column {
    width: 92px;
  }
}
</style>
