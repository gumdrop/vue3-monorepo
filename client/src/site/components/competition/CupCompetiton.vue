<template>
  <v-container v-if="item" fluid :class="gridSize">
    <v-col>
      <QlTextBox>
        <QlNamedText :textName="itemTextName" />
        <QlText :id="item?.text.id" v-if="item.text" />
      </QlTextBox>
    </v-col>
    <LatestResults :path="key" />
    <NextFixtures :path="key" />
  </v-container>
</template>
<script setup lang="ts">
import CompetitionDAO from '@/dao/CompetitionDAO'
import { useKey } from '@/services/KeyService'
import { computed } from 'vue'
import { useDocument } from 'vuefire'
import QlNamedText from '../text/QlNamedText.vue'
import QlText from '../text/QlText.vue'
import QlTextBox from '../text/QlTextBox.vue'
import LatestResults from './LatestResults.vue'
import NextFixtures from './NextFixtures.vue'
import { useLayout } from '@/services/LayoutService'
const { gridSize } = useLayout()

const { decode } = useKey()

const props = defineProps<{ path: string }>()
const key = computed(() => decode(props.path))
const item = useDocument(() => CompetitionDAO.getByPath(key.value))
const itemTextName = computed<string>(() => {
  const competition = item.value as { textName?: string; text?: { id: string } } | undefined
  return competition?.textName ?? competition?.text?.id ?? ''
})
</script>
