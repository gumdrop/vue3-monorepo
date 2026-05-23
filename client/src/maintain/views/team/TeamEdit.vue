<template>
  <v-container v-if="team">
    <v-form ref="form" v-model="valid">
      <v-card>
        <v-card-title>
          {{ isNew ? 'Add' : 'Edit' }} Team
        </v-card-title>
        <v-card-text>
          <v-text-field v-model="team.name" label="Name" :rules="[rules.required('Name')]"></v-text-field>
          <v-text-field v-model="team.shortName" label="Short Name" :rules="[rules.required('Short Name')]"></v-text-field>
          <v-text-field v-model="team.email" label="Email" :rules="[rules.isEmail('Email')]"></v-text-field>
          <v-checkbox v-model="team.retired" label="Retired"></v-checkbox>
          
          <EntitySelect
            v-model="team.venue"
            :dao="VenueDAO"
            label="Venue"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="secondary" to="/team">Cancel</v-btn>
          <v-btn color="primary" @click="save" :disabled="!valid">Save</v-btn>
        </v-card-actions>
      </v-card>
    </v-form>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import TeamDAO from '@/dao/TeamDAO'
import VenueDAO from '@/dao/VenueDAO'
import type Team from '@/entity/Team'
import { useValidations } from '@/site/components/Validation'
import EntitySelect from '../../components/EntitySelect.vue'

const route = useRoute()
const router = useRouter()
const rules = useValidations()

const team = ref<any | null>(null)
const valid = ref(false)

const isNew = computed(() => route.params.id === 'new')

onMounted(async () => {
  if (isNew.value) {
    team.value = {
      id: '',
      path: 'team',
      name: '',
      shortName: '',
      retired: false,
      users: [],
      text: { id: '', path: '' }, // Should be handled
      venue: { id: '', path: '' }
    } as Team
  } else {
    const id = route.params.id as string
    team.value = await TeamDAO.getDataById(id)
  }
})

const save = async () => {
  if (team.value) {
    if (isNew.value) {
        // Simple ID generation for now
        team.value.id = team.value.name.toLowerCase().replace(/\s+/g, '-')
        team.value.path = `team/${team.value.id}`
    }
    await TeamDAO.save(team.value)
    router.push('/team')
  }
}
</script>
