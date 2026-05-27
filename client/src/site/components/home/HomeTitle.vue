<template>
  <SubTitle v-if="season" title="Welcome to the Chiltern Quiz League" icon="mdi-comment-quote" gradient="linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)">
    <template v-slot:subtitle>
      <div class="text-subtitle-1 white--text opacity-80">
        Current Season: {{ season.description }}
      </div>
    </template>
  </SubTitle>
</template>

<script setup lang="ts">
import { useAppContextStore } from '@/stores/app';
import { useDocument } from 'vuefire';
import SeasonDAO from '@/dao/SeasonDAO';
import SubTitle from '../common/SubTitle.vue';

const { seasonId } = useAppContextStore()
const season = useDocument(() => SeasonDAO.getById(seasonId.value))
</script>

<style scoped>
.opacity-80 {
  opacity: 0.8;
}
</style>
