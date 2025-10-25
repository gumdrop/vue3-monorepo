<template>
  <div>

    <v-skeleton-loader v-if="!text && !textError" type="paragraph"></v-skeleton-loader>
    <div v-if="text">
      <div v-if="text.mimeType == 'text/html'" v-html="text.text" class="html"></div>
      <div v-if="text.mimeType == 'text/plain'" v-text="text.text"></div>
      <QlMarkdown v-if="text.mimeType == 'text/markdown'" :text="text.text"></QlMarkdown>
    </div>

  </div>
</template>

<script setup lang="ts">
import TextDAO from '@/dao/TextDAO';
import { useDocument } from 'vuefire';
import QlMarkdown from './QlMarkdown.vue';
import { computed } from 'vue';

const props = defineProps<{
  id: string
}>()

const text = useDocument(() => TextDAO.getById(props.id))

const textError = computed(() => text.error)

</script>
<style lang="css">
.html>p {
  margin-bottom: 16px;
}
</style>
