<template>
  <v-container v-if="appContext">
    <v-form ref="form" v-model="valid">
      <v-card>
        <v-card-title> Application Context </v-card-title>
        <v-card-text>
          <v-text-field
            v-model="appContext.leagueName"
            label="League Name"
            :rules="[rules.required('League Name')]"
          ></v-text-field>
          <EntitySelect v-model="appContext.textSet" :dao="GlobalTextDAO" label="Global Text" />
          <v-text-field
            v-model="appContext.senderEmail"
            label="Sender Email"
            :rules="[rules.isEmail('Sender Email')]"
          ></v-text-field>
          <v-text-field
            v-model="appContext.cloudStoreBucket"
            label="Cloud Store Bucket"
          ></v-text-field>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" @click="save" :disabled="!valid">Save</v-btn>
        </v-card-actions>
      </v-card>
    </v-form>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import ApplicationContextDAO from '@/dao/ApplicationContextDAO'
import GlobalTextDAO from '@/dao/GlobalTextDAO'
import type { ApplicationContext } from '@quizleague/shared'
import { useValidations } from '@/site/components/Validation'
import EntitySelect from '../../components/EntitySelect.vue'

const rules = useValidations()

const appContext = ref<ApplicationContext | null>(null)
const valid = ref(false)

onMounted(async () => {
  appContext.value = (await ApplicationContextDAO.getAppContext()) ?? null
})

const save = async () => {
  if (appContext.value) {
    await ApplicationContextDAO.save(appContext.value)
    alert('Saved')
  }
}
</script>
