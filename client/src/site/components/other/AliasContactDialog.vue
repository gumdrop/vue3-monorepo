<template>
  <v-dialog v-model="show" max-width="60%" v-bind="dialogSize" persistent>
    <v-card>
      <v-card-title>Contact {{ aliasText }}</v-card-title>
      <v-card-text>
        <v-form v-model="valid">
          <v-container>
            <v-row>
              <v-col> <v-text-field required label="Your email address" v-model="email" type="email"
                  :rules="[required('Your email address'), isEmail('Your email address')]"></v-text-field>

                <v-textarea label="Message" v-model="text" outline auto-grow :rules="[required('Message')]"
                  required></v-textarea>
              </v-col>
            </v-row>
          </v-container>
        </v-form>
      </v-card-text>
      <v-card-actions><v-spacer></v-spacer>
        <v-btn @click="$emit('close')"><v-icon start>mdi-cancel</v-icon>Cancel</v-btn><v-btn color="primary" :disabled="!valid"
          v-on:click="submit">Send<v-icon end>mdi-send</v-icon></v-btn></v-card-actions>
    </v-card>
  </v-dialog>



</template>
<script setup lang="ts">
import { ref, watch } from 'vue';
import { useValidations } from '../Validation';

// def submit(c:facade):Unit = {
//   TeamService.sendEmailToAlias(c.email, c.text, c.alias)
//   c.show = false
//   c.text=""
// }

const props = defineProps<{ alias?: string, aliasText?: string, open: boolean }>()

const email = ref<string>()
const text = ref<string>()
const valid = ref(false)
const show = ref(props.open)
const dialogSize = {}

const { required, isEmail } = useValidations()

const submit = () => { }

watch(() => props.open, (open: boolean) => show.value = open)


</script>
