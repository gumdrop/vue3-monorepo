<template>
  <v-container :class="gridSize" v-if="season">
    <PageTitle title="Home" />
    <v-col>
      <v-row>
        <v-col xs12 smAndUp5>
          <HomeTabs />
        </v-col>
        <v-col offset-xs0 offset-md1 xs12>
          <QlTextBox>
            <QlNamedText textName="front-page" />
            <QlText v-if="season.id && season.text" :id="season.text.id" />
          </QlTextBox>
          <div style="margin-top:1em;"></div>
          <ql-chat name="homepagechat" displayName="Chat"></ql-chat>
        </v-col>
      </v-row>
    </v-col>
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
