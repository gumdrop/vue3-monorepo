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
          <EntitySelect
            v-model="appContext.currentSeason"
            :dao="SeasonDAO"
            label="Current Season"
            :item-title="formatSeason"
            :sort-items="sortSeasonsDescending"
            data-test="current-season"
          />
          <v-text-field
            v-model="appContext.senderEmail"
            label="Sender Email"
            :rules="[rules.isEmail('Sender Email')]"
          ></v-text-field>
          <v-text-field
            v-model="appContext.cloudStoreBucket"
            label="Cloud Store Bucket"
          ></v-text-field>

          <v-divider class="my-4"></v-divider>
          <div class="d-flex align-center mb-2">
            <h3 class="text-subtitle-1">Email Aliases</h3>
            <v-spacer></v-spacer>
            <v-btn color="primary" @click="addEmailAlias">Add Alias</v-btn>
          </div>
          <template v-if="appContext.emailAliases.length">
            <v-row
              v-for="(emailAlias, index) in appContext.emailAliases"
              :key="index"
              align="center"
              data-test="email-alias-row"
            >
              <v-col cols="12" md="5">
                <v-text-field
                  v-model="emailAlias.alias"
                  label="Alias"
                  :data-test="`email-alias-${index}`"
                  :rules="[rules.required('Alias')]"
                ></v-text-field>
              </v-col>
              <v-col cols="12" md="6">
                <EntitySelect
                  v-model="emailAlias.user"
                  :dao="UserDAO"
                  label="User"
                  :data-test="`email-alias-user-${index}`"
                />
              </v-col>
              <v-col cols="12" md="1">
                <v-btn
                  icon="mdi-delete"
                  variant="text"
                  :aria-label="`Remove email alias ${emailAlias.alias || index + 1}`"
                  :data-test="`remove-email-alias-${index}`"
                  @click="removeEmailAlias(index)"
                ></v-btn>
              </v-col>
            </v-row>
          </template>
          <div v-else>No email aliases configured</div>
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
import SeasonDAO from '@/dao/SeasonDAO'
import UserDAO from '@/dao/UserDAO'
import type { ApplicationContext } from '@quizleague/shared'
import type Season from '@/entity/Season'
import { useSeason } from '@/services/SeasonService'
import { useValidations } from '@/site/components/Validation'
import EntitySelect from '../../components/EntitySelect.vue'

const rules = useValidations()
const { formatSeason } = useSeason()

const sortSeasonsDescending = (seasons: Season[]) => {
  return seasons.sort((left, right) => Number(right.startYear) - Number(left.startYear))
}

const appContext = ref<ApplicationContext | null>(null)
const valid = ref(false)

onMounted(async () => {
  const context = await ApplicationContextDAO.getAppContext()
  appContext.value = context
    ? {
        ...context,
        emailAliases: context.emailAliases ?? [],
      }
    : null
})

const addEmailAlias = () => {
  appContext.value?.emailAliases.push({
    alias: '',
    user: { id: '', path: '' },
  })
}

const removeEmailAlias = (index: number) => {
  appContext.value?.emailAliases.splice(index, 1)
}

const save = async () => {
  if (appContext.value) {
    await ApplicationContextDAO.save(appContext.value)
    alert('Saved')
  }
}
</script>
