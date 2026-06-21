<template>
  <v-container>
    <v-col>
      <v-card>
        <v-card-text>
          <QlNamedText textName="login-text" />
          <v-text-field v-model.email="email" label="Enter your email address"></v-text-field>
        </v-card-text>
        <v-card-actions>
          <v-btn button v-on:click="googleLogin(email)" :disabled="!email"
            >Sign in with Google</v-btn
          >
          <v-btn
            button
            v-on:click="login(email, $route.query.forward ? $route.query.forward : '/home')"
            :disabled="!email"
            >Sign in by email</v-btn
          >
          <v-btn button v-on:click="doPasswordLogin(email)" :disabled="!email"
            >Sign in with password</v-btn
          >
          <!-- <ql-password-entry v-if="passwordLogin" :email="email" :forward="$route.query.forward?$route.query.forward : '/home'" :registered="registered"></ql-password-entry> -->
        </v-card-actions>
        <v-card-text>
          <v-row align-center style="padding-left: 48%"
            ><v-progress-circular
              v-if="showProgress"
              indeterminate
              color="primary"
            ></v-progress-circular
          ></v-row>
          <v-row>
            <v-alert
              type="info"
              :icon="false"
              outlined
              class="mt-3"
              transition="scroll-y-transition"
              :modelValue="showAlert"
              >An email has been sent with login instructions.</v-alert
            >
          </v-row>
          <v-row>
            <v-alert
              type="error"
              :icon="false"
              outlined
              class="mt-3"
              transition="scale-y-transition"
              :modelValue="showFailure"
              >{{ failureText }}</v-alert
            >
          </v-row>
        </v-card-text>
      </v-card>
    </v-col>
  </v-container>
</template>
<script setup lang="ts">
import useAuth from '@/services/AuthService'
import QlNamedText from '../text/QlNamedText.vue'
import { onMounted, ref } from 'vue'
import { useSideMenuStore } from '@/stores/app'
import { useRouter } from 'vue-router'

const { logonWithGoogle, verifyEmail, checkEmailSignInLink } = useAuth()
const email = ref<string>()
const { setSidemenu } = useSideMenuStore()
const router = useRouter()
setSidemenu(false)

const showAlert = ref(false)
const showFailure = ref(false)
const showProgress = ref(false)
const failureText = ref('')

const genericFailureText = 'Unable to sign in'

onMounted(async () => {
  if (await checkEmailSignInLink()) {
    router.push('/home')
  }
})

const login = async (emailAddress: string | undefined, forward: unknown) => {
  if (!emailAddress) return

  showProgress.value = true
  showFailure.value = false
  try {
    const siteUser = await verifyEmail(emailAddress)
    if (!siteUser) {
      throw new Error(genericFailureText)
    }
    showAlert.value = true
    void forward
  } catch (error) {
    failureText.value = error instanceof Error ? error.message : genericFailureText
    showFailure.value = true
  } finally {
    showProgress.value = false
  }
}

const googleLogin = async (emailAddress: string | undefined) => {
  if (!emailAddress) return

  showProgress.value = true
  showFailure.value = false
  try {
    const siteUser = await logonWithGoogle(emailAddress)
    if (!siteUser) {
      throw new Error(genericFailureText)
    }
  } catch (error) {
    failureText.value = error instanceof Error ? error.message : genericFailureText
    showFailure.value = true
  } finally {
    showProgress.value = false
  }
}

const doPasswordLogin = async (emailAddress: string | undefined) => {
  await login(emailAddress, '/home')
}
</script>
