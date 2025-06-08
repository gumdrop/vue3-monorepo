<template>
  <span>
    <v-skeleton-loader v-if="!t" type="text" width="15em"></v-skeleton-loader>
    <span v-else>{{ $vuetify.display.smAndDown ? t.shortName : t.name }}</span>
  </span>
</template>
<script setup lang="ts">
import type Team from '@/entity/Team';

const { team: t } = defineProps<{ team: Team }>()

</script>
