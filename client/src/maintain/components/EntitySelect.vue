<template>
  <v-autocomplete
    v-model="internalValue"
    :items="items"
    :label="label"
    item-title="name"
    item-value="id"
    :loading="loading"
    clearable
    return-object
    @update:model-value="update"
  ></v-autocomplete>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import type DAO from '@/dao/DAO'
import type Entity from '@/entity/Entity'

const props = defineProps<{
  dao: any
  label: string
  modelValue: any
}>()

const emit = defineEmits(['update:modelValue'])

const items = ref<any[]>([])
const loading = ref(false)
const internalValue = ref<any>(null)

onMounted(async () => {
  loading.value = true
  items.value = await props.dao.list()
  loading.value = false

  if (props.modelValue) {
    internalValue.value = items.value.find(i => i.id === props.modelValue.id)
  }
})

watch(() => props.modelValue, (newVal) => {
  if (newVal) {
    internalValue.value = items.value.find(i => i.id === newVal.id)
  } else {
    internalValue.value = null
  }
})

const update = (val: any) => {
  if (val) {
    emit('update:modelValue', { id: val.id, path: val.path })
  } else {
    emit('update:modelValue', undefined)
  }
}
</script>
