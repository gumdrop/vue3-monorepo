<template>
  <div style="display:none">{{ setTitle(props.title) }}</div>
</template>
<script setup lang="ts">
import useTitleService from '@/services/TitleService'

const props = defineProps<{ title: string }>()

const { setTitle } = useTitleService()

</script>
