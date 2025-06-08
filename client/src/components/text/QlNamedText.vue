<template>
  <QlText :id="id" v-if="id" />
</template>

<script setup lang="ts">
import { useText } from '@/services/TextService';
import { usePromise } from '@/utils/PromiseRef';
import QlText from './QlText.vue';

const props = defineProps<{ textName: string }>()

const { getNamedTextId } = useText()

const id = usePromise(() => getNamedTextId(props.textName))

</script>
