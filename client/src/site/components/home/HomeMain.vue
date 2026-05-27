<template>
  <v-container :class="gridSize" v-if="season" class="home-container pa-0">
    <PageTitle title="Home" />
    
    <v-row class="mt-2" no-gutters>
      <v-col cols="12" md="5">
        <HomeTabs />
      </v-col>
      <v-col cols="12" md="6" offset-md="1">
        <div class="content-section">
          <QlTextBox>
            <QlNamedText textName="front-page" />
            <QlText v-if="season.id && season.text" :id="season.text.id" />
          </QlTextBox>
        </div>
        
        <div class="chat-section mt-6">
          <ql-chat name="homepagechat" displayName="League Chat"></ql-chat>
        </div>
      </v-col>
    </v-row>
  </v-container>
</template>
<script setup lang="ts">
import { useAppContextStore, useSideMenuStore } from '@/stores/app';
import PageTitle from '../common/PageTitle.vue';
import QlText from '../text/QlText.vue';
import { useLayout } from '@/services/LayoutService';
import { useDocument } from 'vuefire';
import SeasonDAO from '@/dao/SeasonDAO';
import QlNamedText from '../text/QlNamedText.vue';
import QlTextBox from '../text/QlTextBox.vue';
import HomeTabs from './HomeTabs.vue';

const { gridSize } = useLayout()
const { seasonId } = useAppContextStore()
const { setSidemenu } = useSideMenuStore()
const season = useDocument(() => SeasonDAO.getById(seasonId.value))
setSidemenu(false)
</script>
<style scoped>
.home-container {
  max-width: 1400px;
}

.opacity-80 {
  opacity: 0.8;
}

.content-section {
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  padding: 8px;
}

.chat-section {
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
}
</style>
