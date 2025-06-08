<template>
  <v-container :class="gridSize" fluid v-if="user">
    <v-col>
      <v-card class="mb-3">
        <v-form v-model="valid" ref="fm">
          <v-card-text>
            <v-col>
              <QlNamedText v-if="$route.query.first == 'true'" textName="profile-first-time" />
              <v-text-field prepend-icon="mdi-account" type="text" label="Handle" v-model="handle"
                :rules="[rules.required, rules.nospaces, rules.nospecials, !handleTaken ? true : 'Handle is already taken']"
                hint="This is how you'll be identified in chat messages." :persistent-hint="true"></v-text-field>
              <v-file-input prepend-icon="mdi-account-circle" label="Avatar"
                placeholder="This will appear alongside your handle in chat messages" :rules="[]"
                hint="Select a file if you wish to customise your avatar." :show-size="true" :persistent-hint="true"
                v-on:change="upload">
              </v-file-input>

            </v-col>
            <v-avatar><img :src="user.avatar"></v-avatar>
          </v-card-text>
          <v-card-actions></v-card-actions>

        </v-form>
      </v-card>
      <v-layout row>
        <v-btn color="primary" text :disabled="!valid || handleTaken"
          @click="saveUser(user, handle); forward($route.query.forward)"><v-icon
            left>mdi-content-save</v-icon>Save</v-btn>
        <v-flex grow><v-alert type="info" :icon="false" outlined border="left" text transition="scroll-y-transition"
            :value="showAlert">Profile Settings Saved.</v-alert></v-flex>
      </v-layout>
    </v-col>
  </v-container>
</template>
<script setup lang="ts">
import { useLayout } from '@/services/LayoutService';
import QlNamedText from '../text/QlNamedText.vue';
import { ref } from 'vue';
import { useUserStore } from '@/stores/app';

const valid = ref(false)

const { user } = useUserStore()
const handle = ref(user?.handle)

const { gridSize } = useLayout()
</script>
