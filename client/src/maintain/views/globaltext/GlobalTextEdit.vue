<template>
  <v-container v-if="globalText">
    <v-form ref="form" v-model="valid">
      <v-card>
        <v-card-title>
          {{ isNew ? 'Add' : 'Edit' }} Global Text
        </v-card-title>
        <v-card-text>
          <v-text-field v-model="globalText.name" label="Name" :rules="[rules.required('Name')]"></v-text-field>
          
          <v-card variant="outlined" class="pa-2 mt-4">
            <v-card-title>Content</v-card-title>
            <v-textarea v-model="textContent" label="Text" auto-grow></v-textarea>
          </v-card>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="secondary" to="/globaltext">Cancel</v-btn>
          <v-btn color="primary" @click="save" :disabled="!valid">Save</v-btn>
        </v-card-actions>
      </v-card>
    </v-form>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import GlobalTextDAO from '@/dao/GlobalTextDAO'
import TextDAO from '@/dao/TextDAO'
import type GlobalText from '@/entity/GlobalText'
import type Text from '@/entity/Text'
import { useValidations } from '@/site/components/Validation'

const route = useRoute()
const router = useRouter()
const rules = useValidations()

const globalText = ref<any | null>(null)
const textContent = ref('')
const valid = ref(false)

const isNew = computed(() => route.params.id === 'new')

onMounted(async () => {
  if (isNew.value) {
    globalText.value = {
      id: '',
      path: 'globaltext',
      name: '',
      text: {}
    }
  } else {
    const id = route.params.id as string
    globalText.value = await GlobalTextDAO.getDataById(id)
    if (globalText.value?.text && globalText.value.text['default']) {
        const textObj = await TextDAO.getData(globalText.value.text['default'])
        if (textObj) {
            textContent.value = textObj.text
        }
    }
  }
})

const save = async () => {
  if (globalText.value) {
    // Save Text entity first
    let textId = globalText.value.text['default']?.id
    if (!textId) {
        textId = globalText.value.name.toLowerCase().replace(/\s+/g, '-') + '-text'
    }
    
    const textEntity: Text = {
        id: textId,
        path: `text/${textId}`,
        text: textContent.value
    } as any
    await TextDAO.save(textEntity)
    
    globalText.value.text['default'] = { id: textId, path: `text/${textId}` }

    if (isNew.value) {
        globalText.value.id = globalText.value.name.toLowerCase().replace(/\s+/g, '-')
        globalText.value.path = `globaltext/${globalText.value.id}`
    }
    await GlobalTextDAO.save(globalText.value)
    router.push('/globaltext')
  }
}
</script>
