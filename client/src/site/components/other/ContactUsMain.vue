<template>
  <v-container :class="gridSize" fluid>
    <QlTitle title="Contact Us" />
    <v-layout column>
      <AliasContactDialog :open="contact" :alias="alias" :aliasText="aliasText" @close="contact = false" />
      <v-col>
        <QlTextBox>
          <p>
            If you would like to start a new team, please contact the <a href="#"
              @click="alias = 'secretary'; aliasText = 'League Secretary'; contact = true">league secretary</a>.
          </p>
          <p>
            To contact an existing team, go to the <router-link to="/team">teams page</router-link>, find your team and
            click on the email button at the top of the page.
          </p>
          <br>
          <p>
            For any queries about this website, please contact the <a href="#"
              @click="alias = 'webmaster'; aliasText = 'the Webmaster'; contact = true;">webmaster</a>.
          </p>
        </QlTextBox>
      </v-col>
      <v-col v-if="user">
        <QlTextBox>
          <h3 id="help-content-mobile">Team Mobile Numbers</h3>
          <QlNamedText textName="help-content-mobiles" />
        </QlTextBox>
      </v-col>
    </v-layout>
  </v-container>
</template>
<script setup lang="ts">
import { useSideMenuStore, useUserStore } from '@/stores/app';
import QlTextBox from '../text/QlTextBox.vue';
import QlNamedText from '../text/QlNamedText.vue';
import QlTitle from '../common/PageTitle.vue';
import { ref } from 'vue';
import AliasContactDialog from './AliasContactDialog.vue';
import { useLayout } from '@/services/LayoutService';
const { gridSize } = useLayout()

const { user } = useUserStore()
const { setSidemenu } = useSideMenuStore()
setSidemenu(false)


const alias = ref<string>()
const aliasText = ref<string>()
const contact = ref(false)

// watch(contact, () => { contact.value = false })


</script>
