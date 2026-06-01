<template>
  <span :class="$vuetify.display.smAndUp ? 'page-header' : 'page-header-small'">
    <span class="page-header-first">{{ first }}&nbsp;</span>
    <span class="page-header-rest"> {{ rest }}</span>
  </span>
</template>
<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{ title: string }>()

const first = computed(() => props.title.split(" ")[0])
const rest = computed(() => props.title.split(" ").slice(1, 3).join(" "))

</script>
<style lang="css" scoped>
.page-header {
  font-family: 'Quicksand', sans-serif;
  display: inline-flex;
  align-items: center;
  font-size: 200% !important;
  font-weight: bold;
  line-height: 1.2;
  margin-left: .3em;
  margin-right: .3em;
  padding-block: .08em;
}

.page-header-first {
  color: #202020;
  text-shadow: 0 0 2px #dfdfdf;
  transition: all 1s ease-out;

}

.page-header-rest {
  color: #dfdfdf;
  text-shadow: 0 0 2px #0c0c0c;
  transition: all 1s ease-out;
}

.page-header-small {
  font-family: 'Quicksand', sans-serif;
  display: inline-flex;
  align-items: center;
  font-size: 120% !important;
  font-weight: bold;
  line-height: 1.2;
  padding-block: .08em;
}

.page-header:hover .page-header-first {

  color: #dfdfdf;
  text-shadow: 0 0 2px #0c0c0c;

}

.page-header:hover .page-header-rest {

  color: #202020;
  text-shadow: 0 0 2px #dfdfdf;

}
</style>
