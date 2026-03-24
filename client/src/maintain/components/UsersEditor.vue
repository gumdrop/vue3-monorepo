<template>
  <div>
    <div class="mb-2">Users</div>
    <v-chip-group>
      <v-chip v-for="(u, idx) in localUsers" :key="idx" closable @click:close="remove(idx)">
        {{ pathValue(u) }}
      </v-chip>
    </v-chip-group>
    <v-row class="mt-2">
      <v-col>
        <v-btn small @click="$emit('add')">Add User</v-btn>
      </v-col>
    </v-row>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import type { PropType } from 'vue'

const props = defineProps({
  users: { type: Array as PropType<any[]>, required: false },
})

const emits = defineEmits(['update:users', 'add', 'remove'])

const localUsers = computed(() => props.users || [])

const pathValue = (obj: any) => {
  if (!obj) return ''
  return obj.path ?? obj.id ?? ''
}

const remove = (idx: number) => {
  const copy = [...localUsers.value]
  copy.splice(idx, 1)
  emits('update:users', copy)
  emits('remove', idx)
}
</script>
