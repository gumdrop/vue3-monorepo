<script setup lang="ts">
import { DocumentReference } from 'firebase/firestore';
import FixtureLine from './FixtureLine.vue';
import { Fixture } from '@/entity/Fixtures';
import { useDocument } from 'vuefire';
const props = defineProps<{ fixtureDoc: DocumentReference<Fixture>, inlineDetails?: boolean }>()

const fixture = useDocument(props.fixtureDoc, { maxRefDepth: 5 })

</script>

<template>
  <FixtureLine v-if="fixture" :fixture="fixture" :inline-details="inlineDetails" />
</template>
