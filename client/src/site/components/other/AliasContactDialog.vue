<template>
  <v-dialog v-model="show" max-width="60%" v-bind="dialogSize" persistent>
    <v-card>
      <v-card-title>Contact {{ aliasText }}</v-card-title>
      <v-card-text>
        <v-alert v-if="error" type="error" class="mb-4">{{ error }}</v-alert>
        <v-form v-model="valid">
          <v-container>
            <v-row>
              <v-col>
                <v-text-field
                  required
                  label="Your email address"
                  v-model="email"
                  type="email"
                  :rules="[required('Your email address'), isEmail('Your email address')]"
                ></v-text-field>

                <v-textarea
                  label="Message"
                  v-model="text"
                  outline
                  auto-grow
                  :rules="[required('Message')]"
                  required
                ></v-textarea>
              </v-col>
            </v-row>
          </v-container>
        </v-form>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn @click="close"><v-icon start>mdi-cancel</v-icon>Cancel</v-btn>
        <v-btn
          color="primary"
          :disabled="!valid || sending"
          :loading="sending"
          data-test="send-contact-email"
          @click="submit"
        >
          Send<v-icon end>mdi-send</v-icon>
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useContact } from '@/services/ContactService'
import { useValidations } from '../Validation'

const props = defineProps<{ alias?: string; aliasText?: string; open: boolean; teamId?: string }>()
const emit = defineEmits<{ close: [] }>()

const email = ref<string>()
const text = ref<string>()
const valid = ref(false)
const show = ref(props.open)
const sending = ref(false)
const error = ref<string>()
const dialogSize = {}

const { required, isEmail } = useValidations()
const { sendEmailToAlias, sendEmailToTeam } = useContact()

const reset = () => {
  email.value = undefined
  text.value = undefined
  error.value = undefined
}

const close = () => {
  error.value = undefined
  emit('close')
}

const submit = async () => {
  if (!valid.value || !email.value || !text.value || (!props.alias && !props.teamId)) return

  sending.value = true
  error.value = undefined
  try {
    if (props.teamId) {
      await sendEmailToTeam(email.value, text.value, props.teamId)
    } else if (props.alias) {
      await sendEmailToAlias(email.value, text.value, props.alias)
    }
    reset()
    emit('close')
  } catch {
    error.value = 'Could not send your message. Please try again.'
  } finally {
    sending.value = false
  }
}

watch(
  () => props.open,
  (open: boolean) => {
    show.value = open
    if (open) error.value = undefined
  },
)
</script>
