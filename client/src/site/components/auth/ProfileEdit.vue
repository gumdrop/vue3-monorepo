<template>
  <v-container :class="gridSize" fluid v-if="user && profile">
    <v-col>
      <v-card class="mb-3">
        <v-form v-model="valid" ref="fm">
          <v-card-text>
            <v-col>
              <QlNamedText v-if="$route.query.first == 'true'" textName="profile-first-time" />
              <v-text-field
                prepend-icon="mdi-account"
                type="text"
                label="Handle"
                v-model="handle"
                :rules="[
                  rules.required,
                  rules.nospaces,
                  rules.nospecials,
                  !handleTaken ? true : 'Handle is already taken',
                ]"
                hint="This is how you'll be identified in chat messages."
                persistent-hint
              ></v-text-field>
              <v-file-input
                prepend-icon="mdi-account-circle"
                label="Avatar"
                placeholder="This will appear alongside your handle in chat messages"
                :rules="[]"
                hint="Select a file if you wish to customise your avatar."
                show-size
                persistent-hint
                v-on:change="upload"
              >
              </v-file-input>
            </v-col>
            <v-avatar><img :src="profile.avatar" /></v-avatar>
          </v-card-text>
          <v-card-actions></v-card-actions>
        </v-form>
      </v-card>
      <v-layout row>
        <v-btn
          color="primary"
          variant="text"
          :disabled="!valid || handleTaken"
          @click="
            saveUser(user, handle)
            forward($route.query.forward)
          "
          ><v-icon left>mdi-content-save</v-icon>Save</v-btn
        >
        <v-flex grow
          ><v-alert
            type="info"
            :icon="false"
            variant="outlined"
            border="start"
            transition="scroll-y-transition"
            :model-value="showAlert"
            >Profile Settings Saved.</v-alert
          ></v-flex
        >
      </v-layout>
    </v-col>
  </v-container>
</template>
<script setup lang="ts">
import SiteUserDAO from '@/dao/SiteUserDAO'
import type { LoggedInUser } from '@/services/AuthService'
import { useLayout } from '@/services/LayoutService'
import QlNamedText from '../text/QlNamedText.vue'
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/app'
import { storeToRefs } from 'pinia'

const valid = ref(false)
const showAlert = ref(false)

const { user } = storeToRefs(useUserStore())
const profile = computed(() => user.value?.siteUser)
const handle = ref(profile.value?.handle ?? '')
const handleTaken = ref(false)

const { gridSize } = useLayout()
const router = useRouter()

const rules = {
  required: (value: string | undefined) => Boolean(value) || 'Handle is required',
  nospaces: (value: string | undefined) => !value?.match(/\s/) || 'No spaces allowed',
  nospecials: (value: string | undefined) =>
    !value?.match(/[^a-zA-Z0-9_-]/) || 'No special characters allowed',
}

const upload = () => {}

const saveUser = async (loggedInUser: LoggedInUser | undefined, newHandle: string) => {
  if (!loggedInUser?.siteUser) return

  const updatedSiteUser = { ...loggedInUser.siteUser, handle: newHandle }
  await SiteUserDAO.save(updatedSiteUser)
  loggedInUser.siteUser.handle = newHandle
  showAlert.value = true
}

const forward = (target: unknown) => {
  if (typeof target === 'string' && target) {
    router.push(target)
  }
}

watch(
  profile,
  (siteUser) => {
    handle.value = siteUser?.handle ?? ''
  },
  { immediate: true },
)
</script>
