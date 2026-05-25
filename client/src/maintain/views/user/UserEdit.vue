<template>
  <v-container v-if="user">
    <v-form ref="form" v-model="valid">
      <v-card>
        <v-card-title> {{ isNew ? 'Add' : 'Edit' }} User </v-card-title>
        <v-card-text>
          <v-text-field
            v-model="user.name"
            label="Name"
            :rules="[rules.required('Name')]"
          ></v-text-field>
          <v-text-field
            v-model="user.email"
            label="Email"
            :rules="[rules.required('Email'), rules.isEmail('Email')]"
          ></v-text-field>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="secondary" to="/user">Cancel</v-btn>
          <v-btn color="primary" @click="save" :disabled="!valid">Save</v-btn>
        </v-card-actions>
      </v-card>
    </v-form>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import UserDAO from '@/dao/UserDAO'
import type User from '@/entity/User'
import { newEntityIdentity } from '@/maintain/utils/entityIds'
import { useValidations } from '@/site/components/Validation'

const route = useRoute()
const router = useRouter()
const rules = useValidations()

const user = ref<any | null>(null)
const valid = ref(false)

const isNew = computed(() => route.params.id === 'new')

onMounted(async () => {
  if (isNew.value) {
    user.value = {
      id: '',
      path: 'user',
      name: '',
      email: '',
    } as User
  } else {
    const id = route.params.id as string
    user.value = await UserDAO.getDataById(id)
  }
})

const save = async () => {
  if (user.value) {
    if (isNew.value) {
      Object.assign(user.value, newEntityIdentity('user'))
    }
    await UserDAO.save(user.value)
    router.push('/user')
  }
}
</script>
