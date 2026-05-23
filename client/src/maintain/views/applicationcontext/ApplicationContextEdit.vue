<template>
  <v-container v-if="appContext">
    <v-form ref="form" v-model="valid">
      <v-card>
        <v-card-title>
          Application Context
        </v-card-title>
        <v-card-text>
          <v-text-field v-model="appContext.leagueName" label="League Name" :rules="[rules.required('League Name')]"></v-text-field>
          <v-text-field v-model="appContext.senderEmail" label="Sender Email" :rules="[rules.isEmail('Sender Email')]"></v-text-field>
          <v-text-field v-model="appContext.cloudStoreBucket" label="Cloud Store Bucket"></v-text-field>
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
import type { ApplicationContext } from '@quizleague/shared'
import { useValidations } from '@/site/components/Validation'

const rules = useValidations()

const appContext = ref<any | null>(null)
const valid = ref(false)

onMounted(async () => {
  appContext.value = await ApplicationContextDAO.getAppContext()
})

const save = async () => {
  if (appContext.value) {
    await ApplicationContextDAO.save(appContext.value)
    alert('Saved')
  }
}
</script>
