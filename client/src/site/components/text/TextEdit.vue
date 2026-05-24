<template>
  <div v-if="local">
    <v-row>
      <v-col cols="12" md="4">
        <v-select :items="mimeOptions" v-model="local.mimeType" label="Mime Type" />
      </v-col>
    </v-row>

    <div v-if="local.mimeType === 'text/plain'">
      <v-textarea v-model="local.text" label="Text" auto-grow />
    </div>

    <div v-else-if="local.mimeType === 'text/markdown'">
      <v-textarea v-model="local.text" label="Markdown" auto-grow />
      <div class="mt-4">
        <h4>Preview</h4>
        <QlMarkdown :text="local.text" />
      </div>
    </div>

    <div v-else-if="local.mimeType === 'text/html'">
      <QuillEditor v-model:content="local.text" content-type="html" />
    </div>
    <v-row class="mt-4">
      <v-col>
        <v-btn color="primary" @click="saveText" :disabled="!local"> Save Text </v-btn>
      </v-col>
    </v-row>
  </div>
  <div v-else>
    <v-alert type="info" outlined>No text selected</v-alert>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import type Text from '@/entity/Text'
import { QuillEditor } from '@vueup/vue-quill'
import '@vueup/vue-quill/dist/vue-quill.snow.css'
import QlMarkdown from './QlMarkdown.vue'

const props = defineProps<{
  modelValue?: Text
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: Text | undefined): void
  (e: 'save', value: Text): void
}>()

const local = ref<Text | undefined>(
  props.modelValue ? { ...(props.modelValue as Text) } : undefined,
)

const mimeOptions = ['text/plain', 'text/markdown', 'text/html']

watch(
  () => props.modelValue,
  (t) => {
    local.value = t ? { ...(t as Text) } : undefined
  },
  { immediate: true },
)

watch(
  () => local.value?.mimeType,
  (mimeType) => {
    if (local.value) {
      emit('update:modelValue', { ...local.value })
    }
  },
)

watch(
  () => local.value?.text,
  (textValue) => {
    if (local.value) {
      emit('update:modelValue', { ...local.value })
    }
  },
)

const saveText = () => {
  if (local.value) {
    emit('save', { ...local.value })
  }
}
</script>

<style scoped>
.html > p {
  margin-bottom: 16px;
}
</style>
