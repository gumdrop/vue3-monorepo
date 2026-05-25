<template>
  <v-container v-if="siteUser">
    <v-form ref="form" v-model="valid">
      <v-card>
        <v-card-title> {{ isNew ? 'Add' : 'Edit' }} Site User </v-card-title>
        <v-card-text>
          <v-text-field
            v-model="siteUser.handle"
            label="Handle"
            :rules="[rules.required('Handle')]"
          ></v-text-field>
          <v-text-field
            v-model="siteUser.email"
            label="Email"
            :rules="[rules.required('Email'), rules.isEmail('Email')]"
          ></v-text-field>
          <v-text-field v-model="siteUser.uid" label="Firebase UID"></v-text-field>

          <EntitySelect v-model="siteUser.user" :dao="UserDAO" label="User Reference" />
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="secondary" to="/siteuser">Cancel</v-btn>
          <v-btn color="primary" @click="save" :disabled="!valid">Save</v-btn>
        </v-card-actions>
      </v-card>
    </v-form>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import SiteUserDAO from '@/dao/SiteUserDAO'
import UserDAO from '@/dao/UserDAO'
import type SiteUser from '@/entity/SiteUser'
import { newEntityIdentity } from '@/maintain/utils/entityIds'
import { useValidations } from '@/site/components/Validation'
import EntitySelect from '../../components/EntitySelect.vue'

const route = useRoute()
const router = useRouter()
const rules = useValidations()

const siteUser = ref<any | null>(null)
const valid = ref(false)

const isNew = computed(() => route.params.id === 'new')

onMounted(async () => {
  if (isNew.value) {
    siteUser.value = {
      id: '',
      path: 'siteuser',
      handle: '',
      email: '',
      uid: '',
      avatar: '',
      user: { id: '', path: '' },
    } as any
  } else {
    const id = route.params.id as string
    siteUser.value = await SiteUserDAO.getDataById(id)
  }
})

const save = async () => {
  if (siteUser.value) {
    if (isNew.value) {
      Object.assign(siteUser.value, newEntityIdentity('siteuser'))
    }
    await SiteUserDAO.save(siteUser.value)
    router.push('/siteuser')
  }
}
</script>
