<template>
    <v-row class="align-center">
        <v-col>
            <v-text-field :value="displayValue" :label="label" @input="onInput" />
        </v-col>
        <v-col cols="auto">
            <v-btn small @click="$emit('choose')">Choose</v-btn>
        </v-col>
    </v-row>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import type { PropType } from 'vue'

const props = defineProps({
    modelValue: { type: [String, Object] as PropType<any>, required: false },
    label: { type: String, default: '' },
})

const emits = defineEmits(['update:modelValue', 'choose'])

const displayValue = computed(() => {
    const v = props.modelValue
    if (!v) return ''
    return typeof v === 'string' ? v : v.path ?? v.id ?? ''
})

const onInput = (val: string) => {
    emits('update:modelValue', val ? { path: val } : undefined)
}
</script>
