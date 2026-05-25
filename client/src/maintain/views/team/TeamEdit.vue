<template>
  <v-container v-if="team">
    <v-form ref="form" v-model="valid">
      <v-card>
        <v-card-title> {{ isNew ? 'Add' : 'Edit' }} Team </v-card-title>
        <v-card-text>
          <v-text-field
            v-model="team.name"
            label="Name"
            :rules="[rules.required('Name')]"
          ></v-text-field>
          <v-text-field
            v-model="team.shortName"
            label="Short Name"
            :rules="[rules.required('Short Name')]"
          ></v-text-field>
          <v-text-field
            v-model="team.handle"
            label="Handle"
          ></v-text-field>
          <v-checkbox v-model="team.retired" label="Retired"></v-checkbox>

          <EntitySelect v-model="team.venue" :dao="VenueDAO" label="Venue" />
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="secondary" to="/team">Cancel</v-btn>
          <v-btn color="primary" @click="save" :disabled="!valid">Save</v-btn>
        </v-card-actions>
      </v-card>
    </v-form>

    <v-card class="mt-4">
      <v-card-title>Users</v-card-title>
      <v-card-text>
        <v-row>
          <v-col>
            <v-select
              v-model="selectedUserId"
              :items="availableUsers"
              item-title="name"
              item-value="id"
              label="User"
              data-test="team-user-select"
            ></v-select>
          </v-col>
          <v-col>
            <v-btn color="primary" @click="addUser" :disabled="!selectedUserId">Add User</v-btn>
          </v-col>
        </v-row>
        <div v-if="assignedUsers.length" class="d-flex flex-wrap ga-2">
          <v-chip
            v-for="user in assignedUsers"
            :key="user.id"
            closable
            :data-test="`remove-user-${user.id}`"
            @click:close="removeUser(user.id)"
          >
            {{ user.name }}
          </v-chip>
        </div>
        <div v-else>No users assigned</div>
      </v-card-text>
    </v-card>

    <v-card class="mt-4" v-if="!isNew">
      <v-card-title>
        Text
        <v-spacer></v-spacer>
        <v-btn v-if="!hasTextReference" color="primary" @click="addText">Add Text</v-btn>
      </v-card-title>
      <v-card-text>
        <TextEdit v-model="text" @save="saveText" />
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import TeamDAO from '@/dao/TeamDAO'
import TextDAO from '@/dao/TextDAO'
import UserDAO from '@/dao/UserDAO'
import VenueDAO from '@/dao/VenueDAO'
import type Team from '@/entity/Team'
import type Text from '@/entity/Text'
import type User from '@/entity/User'
import { useValidations } from '@/site/components/Validation'
import TextEdit from '@/site/components/text/TextEdit.vue'
import EntitySelect from '../../components/EntitySelect.vue'

type EditableTeam = {
  id: string
  path: string
  key?: string
  name: string
  shortName: string
  venue: Team['venue']
  users: Team['users']
  handle?: string
  retired: boolean
  text?: Team['text']
}

const route = useRoute()
const router = useRouter()
const rules = useValidations()

const team = ref<EditableTeam | null>(null)
const text = ref<Text | undefined>()
const users = ref<User[]>([])
const selectedUserId = ref('')
const valid = ref(false)

const isNew = computed(() => route.params.id === 'new')
const hasTextReference = computed(() => Boolean(team.value?.text?.id && team.value?.text?.path))
const availableUsers = computed(() => {
  const assignedIds = new Set(team.value?.users.map((user) => user.id) ?? [])
  return users.value.filter((user) => !assignedIds.has(user.id))
})
const assignedUsers = computed(() => {
  return (
    team.value?.users.map((userRef) => ({
      ...userRef,
      name: users.value.find((user) => user.id === userRef.id)?.name ?? userRef.id,
    })) ?? []
  )
})

onMounted(async () => {
  users.value = (await UserDAO.list()) ?? []

  if (isNew.value) {
    team.value = {
      id: '',
      path: 'team',
      name: '',
      shortName: '',
      handle: '',
      retired: false,
      users: [],
      text: { id: '', path: '' }, // Should be handled
      venue: { id: '', path: '' },
    } as EditableTeam
  } else {
    const id = route.params.id as string
    const loadedTeam = await TeamDAO.getDataById(id)
    team.value = loadedTeam ? { ...loadedTeam } : null
    const textReference = team.value?.text
    if (textReference?.id && textReference.path) {
      text.value = await TextDAO.getData(textReference)
    }
  }
})

const addUser = () => {
  if (!team.value || !selectedUserId.value) return

  const user = users.value.find((user) => user.id === selectedUserId.value)
  if (!user || team.value.users.some((assignedUser) => assignedUser.id === user.id)) return

  team.value.users = [...team.value.users, { id: user.id, path: user.path }]
  selectedUserId.value = ''
}

const removeUser = (userId: string) => {
  if (!team.value) return

  team.value.users = team.value.users.filter((user) => user.id !== userId)
}

const save = async () => {
  if (team.value) {
    if (text.value) {
      await TextDAO.save(text.value)
    }
    if (isNew.value) {
      // Simple ID generation for now
      team.value.id = team.value.name.toLowerCase().replace(/\s+/g, '-')
      team.value.path = `team/${team.value.id}`
    }
    const teamToSave = { ...team.value }
    delete (teamToSave as { email?: string }).email
    await TeamDAO.save(teamToSave as Team)
    router.push('/team')
  }
}

const saveText = async (textEntity: Text) => {
  await TextDAO.save(textEntity)
  text.value = textEntity
}

const addText = async () => {
  if (!team.value) return

  const textId = `${team.value.id}-text`
  const textEntity = { id: textId, path: `text/${textId}`, text: '', mimeType: 'text/html' } as Text
  await TextDAO.save(textEntity)
  team.value.text = { id: textId, path: `text/${textId}` }
  await TeamDAO.save(team.value as Team)
  text.value = textEntity
}
</script>
