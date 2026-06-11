<template>
  <v-container v-if="item" fluid :class="gridSize" class="pa-0">
    <v-row>
      <v-col cols="12">
        <div class="content-wrapper mb-6">
          <QlTextBox>
            <QlNamedText :textName="itemTextName" />
            <QlText :id="item.text.id" v-if="item.text?.id" />
          </QlTextBox>
        </div>
      </v-col>
      <v-col cols="12">
        <LeagueTables :path="key" />
      </v-col>
      <v-col cols="12">
        <CompetitionRoundup :competition="item" />
      </v-col>
    </v-row>
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
import LeagueTables from './LeagueTables.vue'
import CompetitionRoundup from './CompetitionRoundup.vue'
import { useLayout } from '@/services/LayoutService'
const { gridSize } = useLayout()

const { decode } = useKey()

const props = defineProps<{ path: string }>()
const key = computed(() => decode(props.path))
const item = useDocument(() => CompetitionDAO.getByPath(key.value))
const itemTextName = computed<string>(() => {
  const competition = item.value as { textName?: string; text?: { id?: string } } | undefined
  return competition?.textName ?? competition?.text?.id ?? ''
})
</script>
<style scoped>
.content-wrapper {
  background-color: white;
  border-radius: 12px;
  overflow: hidden;
}
</style>
