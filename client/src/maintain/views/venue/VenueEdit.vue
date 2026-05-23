<template>
  <v-container v-if="venue">
    <v-form ref="form" v-model="valid">
      <v-card>
        <v-card-title>
          {{ isNew ? 'Add' : 'Edit' }} Venue
        </v-card-title>
        <v-card-text>
          <v-text-field v-model="venue.name" label="Name" :rules="[rules.required('Name')]"></v-text-field>
          <v-text-field v-model="venue.address" label="Address" :rules="[rules.required('Address')]"></v-text-field>
          <v-text-field v-model="venue.postCode" label="Post Code" :rules="[rules.required('Post Code')]"></v-text-field>
          <v-text-field v-model="venue.phone" label="Phone"></v-text-field>
          <v-text-field v-model="venue.email" label="Email" :rules="[rules.isEmail('Email')]"></v-text-field>
          <v-text-field v-model="venue.website" label="Website"></v-text-field>
          <v-text-field v-model="venue.imageURL" label="Image URL"></v-text-field>
          <v-checkbox v-model="venue.retired" label="Retired"></v-checkbox>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="secondary" to="/venue">Cancel</v-btn>
          <v-btn color="primary" @click="save" :disabled="!valid">Save</v-btn>
        </v-card-actions>
      </v-card>
    </v-form>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import VenueDAO from '@/dao/VenueDAO'
import type Venue from '@/entity/Venue'
import { useValidations } from '@/site/components/Validation'

const route = useRoute()
const router = useRouter()
const rules = useValidations()

const venue = ref<any | null>(null)
const valid = ref(false)

const isNew = computed(() => route.params.id === 'new')

onMounted(async () => {
  if (isNew.value) {
    venue.value = {
      id: '',
      path: 'venue',
      name: '',
      address: '',
      postCode: '',
      retired: false
    } as any
  } else {
    const id = route.params.id as string
    venue.value = await VenueDAO.getDataById(id)
  }
})

const save = async () => {
  if (venue.value) {
    if (isNew.value) {
        venue.value.id = venue.value.name.toLowerCase().replace(/\s+/g, '-')
        venue.value.path = `venue/${venue.value.id}`
    }
    await VenueDAO.save(venue.value)
    router.push('/venue')
  }
}
</script>
