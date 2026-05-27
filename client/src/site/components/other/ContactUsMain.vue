<template>
  <v-container :class="gridSize" fluid class="pa-0">
    <div class="content-wrapper">
      <AliasContactDialog :open="contact" :alias="alias" :aliasText="aliasText" @close="contact = false" />
      <v-col cols="12">
        <QlTextBox>
          <div class="contact-section">
            <h3 class="text-h6 font-weight-bold mb-4 primary--text d-flex align-center">
              <v-icon start color="primary">mdi-account-group-outline</v-icon>
              Starting a New Team
            </h3>
            <p class="mb-4">
              If you would like to start a new team, please contact the 
              <v-btn variant="text" color="primary" class="px-1 font-weight-bold"
                @click="alias = 'secretary'; aliasText = 'League Secretary'; contact = true">
                League Secretary
              </v-btn>.
            </p>
            <p class="mb-6">
              To contact an existing team, go to the 
              <router-link to="/team" class="text-primary font-weight-bold text-decoration-none">teams page</router-link>, 
              find your team and click on the email button at the top of the page.
            </p>
            
            <v-divider class="mb-6"></v-divider>
            
            <h3 class="text-h6 font-weight-bold mb-4 primary--text d-flex align-center">
              <v-icon start color="primary">mdi-web-clock</v-icon>
              Website Queries
            </h3>
            <p>
              For any queries about this website, please contact the 
              <v-btn variant="text" color="primary" class="px-1 font-weight-bold"
                @click="alias = 'webmaster'; aliasText = 'the Webmaster'; contact = true;">
                Webmaster
              </v-btn>.
            </p>
          </div>
        </QlTextBox>
      </v-col>
      
      <v-col cols="12" v-if="user" class="mt-4">
        <div class="user-section p-4">
          <QlTextBox>
            <h3 id="help-content-mobile" class="text-h6 font-weight-bold mb-4 primary--text">Team Mobile Numbers</h3>
            <QlNamedText textName="help-content-mobiles" />
          </QlTextBox>
        </div>
      </v-col>
    </div>
  </v-container>
</template>
<script setup lang="ts">
import { useSideMenuStore, useUserStore } from '@/stores/app';
import QlTextBox from '../text/QlTextBox.vue';
import QlNamedText from '../text/QlNamedText.vue';
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

</script>
<style scoped>
.content-wrapper {
  background-color: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.contact-section p {
  font-size: 1.05rem;
  line-height: 1.6;
  color: #334155;
}

.v-btn {
  height: auto !important;
  min-width: 0 !important;
  text-transform: none !important;
  vertical-align: baseline !important;
}
</style>
