<template>
  <v-container>
    <v-col>
      <v-card>
        <v-card-text>
          <QlNamedText textName="login-text" />
          <v-text-field v-model.email="email" label="Enter your email address"></v-text-field>
        </v-card-text>
        <v-card-actions>
          <v-btn button v-on:click="login(email, $route.query.forward ? $route.query.forward : '/home')"
            :disabled="!email">Sign in by email</v-btn>
          <v-btn button v-on:click="logonWithGoogle(email)" :disabled="!email">Sign with Google</v-btn>
          <v-btn button v-on:click="doPasswordLogin(email)" :disabled="!email">Sign in with password</v-btn>
          <!-- <ql-password-entry v-if="passwordLogin" :email="email" :forward="$route.query.forward?$route.query.forward : '/home'" :registered="registered"></ql-password-entry> -->
        </v-card-actions>
        <v-card-text>
          <v-row align-center style="padding-left:48%;"><v-progress-circular v-if="showProgress" indeterminate
              color="primary"></v-progress-circular></v-row>
          <v-row>
            <v-alert type="info" :icon="false" outlined class="mt-3" transition="scroll-y-transition"
              :modelValue="showAlert">An email has been sent with login instructions.</v-alert>
          </v-row>
          <v-row>
            <v-alert type="error" :icon="false" outlined class="mt-3" transition="scale-y-transition"
              :modelValue="showFailure">{{ failureText }}</v-alert>
          </v-row>
        </v-card-text>
      </v-card>

    </v-col>
  </v-container>
</template>
<script setup lang="ts">
import useAuth from '@/services/AuthService';
import QlNamedText from '../text/QlNamedText.vue';
import { ref } from 'vue';
import { useSideMenuStore } from '@/stores/app';

const { logonWithGoogle } = useAuth()
const email = ref<string>()
const { setSidemenu } = useSideMenuStore()
setSidemenu(false)

const showAlert = ref(false)
const showFailure = ref(false)
const failureText = ref("")
</script>
