<template>
  <div>
    <div class="mb-2">Email Aliases</div>
    <v-chip-group>
      <v-chip v-for="(a, idx) in localAliases" :key="idx" closable @click:close="remove(idx)">
        {{ a.alias }}::{{ pathValue(a.user) }}
      </v-chip>
    </v-chip-group>
    <v-row class="mt-2">
      <v-col>
        <v-btn small @click="$emit('add')">Pick User</v-btn>
      </v-col>
    </v-row>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import type { PropType } from 'vue'

const props = defineProps({
  aliases: { type: Array as PropType<any[]>, required: false },
})

const emits = defineEmits(['update:aliases', 'add', 'remove'])

const localAliases = computed(() => props.aliases || [])

const pathValue = (obj: any) => {
  if (!obj) return ''
  return obj.path ?? obj.id ?? ''
}

const remove = (idx: number) => {
  const copy = [...localAliases.value]
  copy.splice(idx, 1)
  emits('update:aliases', copy)
  emits('remove', idx)
}
</script>
