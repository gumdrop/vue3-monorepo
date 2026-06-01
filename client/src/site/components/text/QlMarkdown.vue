<template>
  <vue-showdown :markdown="textVal" :options="settings.options" :flavor="settings.flavor"
    :vue-template="settings.vueTemplate" :extensions="settings.extensions" class="html" />
</template>
<script setup lang="ts">
import { ref, watch } from 'vue'
import { settings } from "@/settings/showdown"
import { VueShowdown } from 'vue-showdown';

const props = defineProps<{ text: string }>()

const textVal = ref("")


watch(() => props.text, (newText: string) => {
  textVal.value = newText
}, { immediate: true })

</script>
<style lang="css">
.html li {
  margin-left: 1em;
}
</style>
