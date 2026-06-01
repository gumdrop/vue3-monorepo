<template>
  <v-container v-if="globalText">
    <v-form ref="form" v-model="valid">
      <v-card>
        <v-card-title> {{ isNew ? 'Add' : 'Edit' }} Global Text </v-card-title>
        <v-card-text>
          <v-text-field
            v-model="globalText.name"
            label="Name"
            :rules="[rules.required('Name')]"
          ></v-text-field>

          <v-card variant="outlined" class="pa-2 mt-4">
            <v-card-title>
              Text References
              <v-spacer></v-spacer>
              <v-btn color="primary" @click="addTextReference">Add Text Reference</v-btn>
            </v-card-title>
            <v-card-text>
              <v-alert v-if="hasDuplicateTextNames" type="error" class="mb-4">
                Text names must be unique.
              </v-alert>
              <div v-if="!textRows.length">No text references</div>
              <v-row v-for="(row, index) in textRows" :key="row.uid" align="center">
                <v-col cols="12" md="8">
                  <v-text-field
                    v-model="row.name"
                    label="Text Name"
                    :data-test="`global-text-name-${index}`"
                    :rules="[rules.required('Text Name')]"
                  ></v-text-field>
                </v-col>
                <v-col cols="12" md="4">
                  <v-btn
                    color="primary"
                    variant="text"
                    :data-test="`edit-text-${index}`"
                    :disabled="!row.name.trim()"
                    @click="showTextEditor(row)"
                  >
                    Edit Text
                  </v-btn>
                  <v-btn
                    color="secondary"
                    icon="mdi-delete"
                    variant="text"
                    :data-test="`remove-text-${index}`"
                    @click="removeTextReference(row)"
                  ></v-btn>
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="secondary" to="/globaltext">Cancel</v-btn>
          <v-btn color="primary" @click="save" :disabled="!canSave">Save</v-btn>
        </v-card-actions>
      </v-card>
    </v-form>

    <v-dialog v-model="textEditorOpen" max-width="960" data-test="text-editor-dialog">
      <v-card>
        <v-card-title>
          {{ selectedRowLabel }}
        </v-card-title>
        <v-card-text>
          <TextEdit v-model="selectedText" @save="saveText" />
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="secondary" @click="closeTextEditor">Close</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import GlobalTextDAO from '@/dao/GlobalTextDAO'
import TextDAO from '@/dao/TextDAO'
import type GlobalText from '@/entity/GlobalText'
import type Text from '@/entity/Text'
import { newEntityId, newEntityIdentity } from '@/maintain/utils/entityIds'
import { useValidations } from '@/site/components/Validation'
import TextEdit from '@/site/components/text/TextEdit.vue'

type TextReference = {
  id: string
  path: string
}

type EditableGlobalText = Omit<GlobalText, 'id' | 'path' | 'text'> & {
  id: string
  path: string
  text: Record<string, TextReference>
}

type TextReferenceRow = {
  uid: string
  name: string
  textId: string
}

const route = useRoute()
const router = useRouter()
const rules = useValidations()

const globalText = ref<EditableGlobalText | null>(null)
const textRows = ref<TextReferenceRow[]>([])
const selectedRowUid = ref('')
const selectedText = ref<Text | undefined>()
const textEditorOpen = ref(false)
const valid = ref(false)
let nextRowUid = 0

const isNew = computed(() => route.params.id === 'new')
const selectedRow = computed(() => textRows.value.find((row) => row.uid === selectedRowUid.value))
const selectedRowLabel = computed(() => selectedRow.value?.name || selectedText.value?.id || 'Text')
const textNames = computed(() =>
  textRows.value.map((row) => row.name.trim()).filter((name) => name.length > 0),
)
const hasDuplicateTextNames = computed(
  () => new Set(textNames.value).size !== textNames.value.length,
)
const canSave = computed(
  () =>
    valid.value && !hasDuplicateTextNames.value && textRows.value.every((row) => row.name.trim()),
)

const pathFromTextId = (id: string) => `text/${id.trim()}`
const resolveTextId = (row: TextReferenceRow) => {
  const textId = row.textId.trim()
  if (textId) return textId
  if (!row.name.trim()) return ''

  row.textId = newEntityId()
  return row.textId
}

const makeRow = (name = '', textId = ''): TextReferenceRow => ({
  uid: `text-reference-${nextRowUid++}`,
  name,
  textId,
})

const loadRows = (textMap: Record<string, TextReference> = {}) => {
  textRows.value = Object.entries(textMap).map(([name, textReference]) =>
    makeRow(name, textReference?.id ?? ''),
  )
}

const buildTextMap = () =>
  Object.fromEntries(
    textRows.value
      .filter((row) => row.name.trim())
      .map((row) => {
        const textId = resolveTextId(row)
        return [row.name.trim(), { id: textId, path: pathFromTextId(textId) }]
      }),
  )

onMounted(async () => {
  if (isNew.value) {
    globalText.value = {
      id: '',
      path: 'globaltext',
      name: '',
      text: {},
    }
    loadRows()
  } else {
    const id = route.params.id as string
    globalText.value =
      ((await GlobalTextDAO.getDataById(id)) as EditableGlobalText | undefined) ?? null
    loadRows(globalText.value?.text)
  }
})

const addTextReference = () => {
  textRows.value = [...textRows.value, makeRow()]
}

const removeTextReference = (rowToRemove: TextReferenceRow) => {
  textRows.value = textRows.value.filter((row) => row.uid !== rowToRemove.uid)
  if (selectedRowUid.value === rowToRemove.uid) {
    selectedRowUid.value = ''
    selectedText.value = undefined
    textEditorOpen.value = false
  }
}

const showTextEditor = async (row: TextReferenceRow) => {
  const textId = resolveTextId(row)
  if (!textId) return

  row.textId = textId
  const textReference = { id: textId, path: pathFromTextId(textId) }
  selectedRowUid.value = row.uid
  selectedText.value =
    (await TextDAO.getData(textReference)) ??
    ({
      ...textReference,
      text: '',
      mimeType: 'text/html',
    } as Text)
  textEditorOpen.value = true
}

const saveText = async (textEntity: Text) => {
  await TextDAO.save(textEntity)
  selectedText.value = textEntity
  if (selectedRow.value) {
    selectedRow.value.textId = textEntity.id
  }
  textEditorOpen.value = false
}

const closeTextEditor = () => {
  textEditorOpen.value = false
}

const save = async () => {
  if (globalText.value) {
    if (selectedText.value) {
      await TextDAO.save(selectedText.value)
    }

    if (isNew.value) {
      Object.assign(globalText.value, newEntityIdentity('globaltext'))
    }
    globalText.value.text = buildTextMap()
    await GlobalTextDAO.save(globalText.value)
    router.push('/globaltext')
  }
}
</script>
