<template>
  <v-container :class="gridSize" fluid>
    <v-col v-if="team">
      <v-form v-model="valid" ref="fm">
        <v-card class="mb-3">
          <v-card-title>Names</v-card-title>
          <v-card-text>
            <v-text-field
              label="Name"
              v-model="team.name"
              length="20"
              :rules="[required('Name')]"
            ></v-text-field>
            <v-text-field
              label="Short Name"
              v-model="team.shortName"
              length="10"
              :rules="[required('Short Name')]"
            ></v-text-field>
          </v-card-text>
        </v-card>
        <v-card class="mb-3">
          <v-card-title>Team Members</v-card-title>
          <v-card-text>
            <v-btn color="primary" @click="newUser()" dark prepend-icon="mdi-account-plus"
              >Add User</v-btn
            >
            <v-dialog v-model="dialog" persistent max-width="600px">
              <v-card>
                <v-card-title>
                  <span class="headline"><v-icon>mdi-account-plus</v-icon>&nbsp;New User</span>
                </v-card-title>
                <v-card-text v-if="user">
                  <v-container grid-list-md>
                    <v-col>
                      <v-text-field
                        prepend-icon="mdi-account"
                        label="Name"
                        required
                        :rules="[required('Name')]"
                        v-model="user.name"
                      ></v-text-field>

                      <v-text-field
                        prepend-icon="mdi-email"
                        label="Email"
                        type="email"
                        required
                        :rules="[required('Email'), isEmail('Email')]"
                        v-model="user.email"
                      ></v-text-field>
                    </v-col>
                  </v-container>
                </v-card-text>
                <v-card-actions v-if="user">
                  <v-spacer></v-spacer>
                  <v-btn
                    color="blue darken-1"
                    @click="dialog = false"
                    prepend-icon="mdi-close-circle"
                    >Cancel</v-btn
                  >
                  <v-btn
                    color="blue darken-1"
                    @click="confirmAddUser(user)"
                    :disabled="!valid"
                    prepend-icon="mdi-account-plus"
                    >Add</v-btn
                  >
                </v-card-actions>
              </v-card>
            </v-dialog>
            <v-col v-if="users">
              <v-icon color="primary">mdi-account-multiple</v-icon>&nbsp;<v-chip
                v-for="usr in users"
                closable
                @click:close="removeUser(usr.id, users)"
                :key="usr.id"
                >{{ usr.name }}</v-chip
              >
            </v-col>
          </v-card-text>
        </v-card>
        <v-card class="mb-3">
          <v-card-title>Rubric</v-card-title>
          <v-card-text>
            <QuillEditor v-if="text" v-model:content="text.text" content-type="html" />
          </v-card-text>
        </v-card>
        <v-col>
          <v-row>
            <v-col cols="3/12"
              ><v-btn
                prepend-icon="mdi-content-save"
                color="primary"
                v-on:click="submit(team, text, users)"
                :disabled="!valid"
                >Save</v-btn
              >
            </v-col>
            <v-col grow
              ><v-alert
                type="info"
                :icon="false"
                outlined
                transition="scroll-y-transition"
                :model-value="success"
                >Team details saved</v-alert
              ></v-col
            >
          </v-row>
        </v-col>
      </v-form>
    </v-col>
  </v-container>
</template>
<script setup lang="ts">
import TeamDAO from '@/dao/TeamDAO'
import TextDAO from '@/dao/TextDAO'
import UserDAO from '@/dao/UserDAO'
import type Team from '@/entity/Team'
import type Text from '@/entity/Text'
import User from '@/entity/User'
import { useLayout } from '@/services/LayoutService'
import { QuillEditor } from '@vueup/vue-quill'
import '@vueup/vue-quill/dist/vue-quill.snow.css'
import { DocumentReference } from 'firebase/firestore'
import { ref, shallowRef, watch } from 'vue'
import { useDocument } from 'vuefire'
import { useValidations } from '../Validation'
import { useUserStore } from '@/stores/app'
import { storeToRefs } from 'pinia'

const valid = ref(false)
const dialog = ref(false)
const success = ref(false)

const { gridSize } = useLayout()
const { required, isEmail } = useValidations()

const { user: loggedInUser } = storeToRefs(useUserStore())
const team = useDocument(() => TeamDAO.getById(loggedInUser.value?.team.id), { maxRefDepth: 0 })
const textDoc = ref<DocumentReference<Text>>()
const text = useDocument(textDoc)

const users = shallowRef<User[] | undefined>([])

const user = shallowRef<User>()

const removeUser = (id: string, userList: User[]) => {
  users.value = userList.filter((u) => u.id != id)
}

const submit = async (team: Team, text: Text | undefined, users: User[] | undefined) => {
  if (text) {
    TextDAO.save(text)
  }
  if (users) {
    team.users = users.map((u) => ({ id: u.id, path: u.path }))
  }
  await TeamDAO.update(team.path, { name: team.name, shortName: team.shortName, users: team.users })

  success.value = true
}

const newUser = () => {
  user.value = UserDAO.newInstance()
  dialog.value = true
}

const addUser = (user: User) => {
  UserDAO.save(user)
  if (users.value) {
    users.value.push(user)
  }
}

const confirmAddUser = (user: User) => {
  dialog.value = false
  addUser(user)
}

watch(
  () => team.value,
  async (team) => {
    if (team) {
      users.value = await UserDAO.entityList(team.users)
      textDoc.value = TextDAO.getByPath(team.text)
    }
  },
  { immediate: true },
)
</script>
