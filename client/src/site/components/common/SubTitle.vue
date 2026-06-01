<template>
  <div class="hero-header pa-4 mb-6 elevation-2" :style="containerStyle">
    <QlTitle :title="title" />
    <div class="d-flex align-center flex-wrap">
      <div v-if="icon" class="header-icon-wrapper mr-4">
        <v-icon color="white" size="32">{{ icon }}</v-icon>
      </div>
      <div class="flex-grow-1">
        <h1 class="text-h4 font-weight-bold white--text">{{ title }}</h1>
        <slot name="subtitle"></slot>
      </div>
      <div class="header-actions">
        <slot name="actions"></slot>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import QlTitle from './PageTitle.vue';

const props = defineProps<{
  title: string,
  colour?: string,
  icon?: string,
  gradient?: string
}>()

const containerStyle = computed(() => {
  if (props.gradient) return { background: props.gradient }
  // Map some common Vuetify colors to modern gradients if no gradient is provided
  const colorMap: Record<string, string> = {
    'amber-lighten-3': 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)',
    'orange-lighten-3': 'linear-gradient(135deg, #ea580c 0%, #f97316 100%)',
    'purple-lighten-3': 'linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%)',
    'blue-lighten-3': 'linear-gradient(135deg, #2563eb 0%, #60a5fa 100%)',
    'green-lighten-3': 'linear-gradient(135deg, #059669 0%, #34d399 100%)',
  }
  return { background: colorMap[props.colour || ''] || 'linear-gradient(135deg, #64748b 0%, #94a3b8 100%)' }
})

</script>

<style lang="css" scoped>
.hero-header {
  border-radius: 12px;
  color: white;
  min-height: 100px;
  display: flex;
  align-items: center;
}

.header-icon-wrapper {
  background-color: rgba(255, 255, 255, 0.2);
  padding: 12px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

h1 {
  margin: 0;
  line-height: 1.2;
}

@media (max-width: 600px) {
  .hero-header {
    min-height: auto;
    padding: 16px !important;
  }
  .header-icon-wrapper {
    padding: 8px;
  }
  .text-h4 {
    font-size: 1.5rem !important;
  }
}
</style>
