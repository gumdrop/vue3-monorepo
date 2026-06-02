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
          <v-text-field v-model="team.handle" label="Handle"></v-text-field>
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
import TeamMemberDAO from '@/dao/TeamMemberDAO'
import TextDAO from '@/dao/TextDAO'
import UserDAO from '@/dao/UserDAO'
import VenueDAO from '@/dao/VenueDAO'
import type Team from '@/entity/Team'
import type TeamMember from '@/entity/TeamMember'
import type Text from '@/entity/Text'
import type User from '@/entity/User'
import { newEntityIdentity } from '@/maintain/utils/entityIds'
import { useValidations } from '@/site/components/Validation'
import TextEdit from '@/site/components/text/TextEdit.vue'
import EntitySelect from '../../components/EntitySelect.vue'

type EditableTeam = {
  id: string
  path: string
  key?: string
  name: string
  shortName: string
  venue?: Team['venue']
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
const memberUsers = ref<TeamMember['users']>([])
const selectedUserId = ref('')
const valid = ref(false)

const isNew = computed(() => route.params.id === 'new')
const hasTextReference = computed(() => Boolean(team.value?.text?.id && team.value?.text?.path))
const availableUsers = computed(() => {
  const assignedIds = new Set(memberUsers.value.map((user) => user.id))
  return users.value.filter((user) => !assignedIds.has(user.id))
})
const assignedUsers = computed(() => {
  return memberUsers.value.map((userRef) => ({
    ...userRef,
    name: users.value.find((user) => user.id === userRef.id)?.name ?? userRef.id,
  }))
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
      text: undefined,
      venue: undefined,
    } as EditableTeam
    memberUsers.value = []
  } else {
    const id = route.params.id as string
    const loadedTeam = await TeamDAO.getDataById(id)
    team.value = loadedTeam ? { ...loadedTeam } : null
    if (team.value) {
      const teamMember = await TeamMemberDAO.getDataForTeam(team.value)
      const legacyUsers = (loadedTeam as (Team & { users?: TeamMember['users'] }) | undefined)
        ?.users
      memberUsers.value = teamMember ? teamMember.users : (legacyUsers ?? [])
    }
    const textReference = team.value?.text
    if (textReference?.id && textReference.path) {
      text.value = await TextDAO.getData(textReference)
    }
  }
})

const addUser = () => {
  if (!team.value || !selectedUserId.value) return

  const user = users.value.find((user) => user.id === selectedUserId.value)
  if (!user || memberUsers.value.some((assignedUser) => assignedUser.id === user.id)) return

  memberUsers.value = [...memberUsers.value, { id: user.id, path: user.path }]
  selectedUserId.value = ''
}

const removeUser = (userId: string) => {
  if (!team.value) return

  memberUsers.value = memberUsers.value.filter((user) => user.id !== userId)
}

const save = async () => {
  if (team.value) {
    if (text.value) {
      await TextDAO.save(text.value)
    }
    if (isNew.value) {
      Object.assign(team.value, newEntityIdentity('team'))
    }
    const teamToSave = { ...team.value }
    delete (teamToSave as { email?: string }).email
    delete (teamToSave as { users?: TeamMember['users'] }).users
    if (!teamToSave.text) delete teamToSave.text
    if (!teamToSave.venue) delete teamToSave.venue
    await TeamDAO.save(teamToSave as Team)
    await TeamMemberDAO.saveForTeam(teamToSave as Team, memberUsers.value)
    router.push('/team')
  }
}

const saveText = async (textEntity: Text) => {
  await TextDAO.save(textEntity)
  text.value = textEntity
}

const addText = async () => {
  if (!team.value) return

  const textReference = newEntityIdentity('text')
  const textEntity = { ...textReference, text: '', mimeType: 'text/html' } as Text
  await TextDAO.save(textEntity)
  team.value.text = textReference
  await TeamDAO.save(team.value as Team)
  text.value = textEntity
}
</script>
