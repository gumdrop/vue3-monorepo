<template>
  <v-app style="font-size:16px;">
    <v-app-bar color="blue-darken-3" dark fixed app clipped-left scroll-behavior="hide">
      <v-app-bar-nav-icon @click.stop="drawer = !drawer"></v-app-bar-nav-icon>
      <v-toolbar-title>Quizleague Data Maintenance</v-toolbar-title>
    </v-app-bar>

    <v-navigation-drawer clipped width="280" app :disable-resize-watcher="true" v-model="drawer">
      <v-list>
        <v-list-item v-for="type in entityTypes" :key="type.key" @click="selectType(type)"
          :active="selectedType?.key === type.key">
          <v-list-item-title>{{ type.label }}</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-navigation-drawer>

    <v-main>
      <v-container>
        <v-row>
          <v-col cols="4">
            <v-card>
              <v-card-title>Items</v-card-title>
              <v-divider />
              <v-list>
                <v-list-item v-for="item in items" :key="item?.path" @click="selectItem(item)" clickable>
                  <v-list-item-content>
                    <v-list-item-title>{{ item?.name || item?.path }}</v-list-item-title>
                    <v-list-item-subtitle v-if="item?.retired">(retired)</v-list-item-subtitle>
                  </v-list-item-content>
                </v-list-item>
              </v-list>
            </v-card>
          </v-col>

          <v-col cols="8">
            <v-card>
              <v-card-title>Details</v-card-title>
              <v-divider />
              <v-card-text>
                <div v-if="!selectedItem">Select an item to view or edit</div>
                <div v-else>
                  <v-form ref="detailsForm">
                    <v-text-field v-model="selectedItem.name" label="Name" :rules="[requiredRule]" />

                    <!-- Team fields -->
                    <div v-if="isType('team')">
                      <v-text-field v-model="selectedItem.shortName" label="Short Name" />
                      <PathField v-model="selectedItem.venue" label="Venue Path"
                        @choose="openPicker('venue', 'venue')" />
                      <PathField v-model="selectedItem.text" label="Text Path" @choose="openPicker('text', 'text')" />
                      <v-text-field v-model="selectedItem.handle" label="Handle" />
                      <UsersEditor :users="selectedItem.users" @update:users="val => selectedItem.users = val"
                        @add="openPicker('users', 'user', true)" @remove="removeUser" />
                      <v-checkbox v-model="selectedItem.retired" label="Retired" />
                    </div>

                    <!-- Competition fields -->
                    <div v-if="isType('competition')">
                      <v-text-field v-model="selectedItem._name" label="Competition Type (_name)" />
                      <v-text-field v-model.number="selectedItem.duration" label="Duration" type="number" />
                      <v-text-field v-model="selectedItem.icon" label="Icon" />
                      <v-text-field v-model="selectedItem.startTime" label="Start Time" />
                      <v-text-field v-model.number="selectedItem.win" label="Win" type="number"
                        v-if="'win' in selectedItem" />
                      <v-text-field v-model.number="selectedItem.loss" label="Loss" type="number"
                        v-if="'loss' in selectedItem" />
                      <v-text-field v-model.number="selectedItem.draw" label="Draw" type="number"
                        v-if="'draw' in selectedItem" />
                      <PathField v-model="selectedItem.text" label="Text Path" @choose="openPicker('text', 'text')" />
                      <v-checkbox v-model="selectedItem.retired" label="Retired" v-if="'retired' in selectedItem" />
                    </div>

                    <!-- Season fields -->
                    <div v-if="isType('season')">
                      <v-text-field v-model.number="selectedItem.startYear" label="Start Year" type="number" />
                      <v-text-field v-model.number="selectedItem.endYear" label="End Year" type="number" />
                      <PathField v-model="selectedItem.text" label="Text Path" @choose="openPicker('text', 'text')" />
                      <CompetitionEditor v-if="selectedItem?.path" :seasonPath="selectedItem.path"
                        @created="reloadList()" @saved="reloadList()" />
                    </div>

                    <!-- Venue fields -->
                    <div v-if="isType('venue')">
                      <v-text-field v-model="selectedItem.address" label="Address" />
                      <v-text-field v-model="selectedItem.phone" label="Phone" />
                      <v-text-field v-model="selectedItem.email" label="Email" />
                      <v-text-field v-model="selectedItem.website" label="Website" />
                      <v-text-field v-model="selectedItem.imageURL" label="Image URL" />
                      <v-checkbox v-model="selectedItem.retired" label="Retired" />
                    </div>

                    <!-- Text fields -->
                    <div v-if="isType('text')">
                      <v-textarea v-model="selectedItem.text" label="Text" auto-grow rows="6" />
                      <v-text-field v-model="selectedItem.mimeType" label="MIME Type" />
                    </div>

                    <!-- User fields -->
                    <div v-if="isType('user')">
                      <v-text-field v-model="selectedItem.email" label="Email" />
                      <v-checkbox v-model="selectedItem.retired" label="Retired" />
                    </div>

                    <!-- ApplicationContext fields -->
                    <div v-if="isType('appcontext')">
                      <v-text-field v-model="selectedItem.leagueName" label="League Name" />
                      <PathField v-model="selectedItem.textSet" label="TextSet Path"
                        @choose="openPicker('textSet', 'globaltext')" />
                      <PathField v-model="selectedItem.currentSeason" label="Current Season Path"
                        @choose="openPicker('currentSeason', 'season')" />
                      <v-text-field v-model="selectedItem.senderEmail" label="Sender Email" />
                      <EmailAliasesEditor :aliases="selectedItem.emailAliases"
                        @update:aliases="val => selectedItem.emailAliases = val"
                        @add="openPicker('emailAliases', 'user', true)" @remove="removeEmailAlias" />
                      <v-text-field v-model="selectedItem.cloudStoreBucket" label="Cloud Store Bucket" />
                    </div>
                  </v-form>
                </div>
              </v-card-text>
              <v-card-actions>
                <v-spacer />
                <v-btn color="primary" :disabled="!selectedItem" @click="saveItem">Save</v-btn>
                <v-btn text @click="reloadList">Refresh</v-btn>
              </v-card-actions>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </v-main>

    <!-- Picker dialog for selecting related entities -->
    <v-dialog v-model="pickerOpen" width="600">
      <v-card>
        <v-card-title>{{ pickerTitle }}</v-card-title>
        <v-divider />
        <v-card-text>
          <v-row>
            <v-col>
              <div v-if="!pickerCreateMode">
                <v-text-field v-model="pickerNewName" label="Create new (name)" />
              </div>

              <div v-else>
                <!-- Create details form: fields depend on dao.entity -->
                <v-form ref="pickerCreateForm">
                  <v-text-field v-model="pickerCreateData.name" label="Name" :rules="[requiredRule]" />
                  <template v-if="pickerDao && pickerDao.entity === 'team'">
                    <v-text-field v-model="pickerCreateData.shortName" label="Short Name" />
                    <v-text-field v-model="pickerCreateData.handle" label="Handle" />
                  </template>
                  <template v-else-if="pickerDao && pickerDao.entity === 'venue'">
                    <v-text-field v-model="pickerCreateData.address" label="Address" />
                    <v-text-field v-model="pickerCreateData.phone" label="Phone" />
                    <v-text-field v-model="pickerCreateData.email" label="Email" :rules="[emailRule]" />
                    <v-text-field v-model="pickerCreateData.website" label="Website" />
                  </template>
                  <template v-else-if="pickerDao && pickerDao.entity === 'user'">
                    <v-text-field v-model="pickerCreateData.email" label="Email" :rules="[requiredRule, emailRule]" />
                  </template>
                  <template v-else-if="pickerDao && pickerDao.entity === 'text'">
                    <v-textarea v-model="pickerCreateData.text" label="Text" rows="4" auto-grow />
                    <v-text-field v-model="pickerCreateData.mimeType" label="MIME Type" />
                  </template>
                  <template v-else-if="pickerDao && pickerDao.entity === 'season'">
                    <v-text-field v-model.number="pickerCreateData.startYear" label="Start Year" type="number"
                      :rules="[numberRule]" />
                    <v-text-field v-model.number="pickerCreateData.endYear" label="End Year" type="number"
                      :rules="[numberRule]" />
                  </template>
                </v-form>
              </div>
            </v-col>
            <v-col cols="auto" class="d-flex align-center">
              <div v-if="!pickerCreateMode">
                <v-btn color="primary" @click="createNewItem">Create</v-btn>
                <v-btn text @click="pickerCreateMode = true">Create with details</v-btn>
              </div>
              <div v-else>
                <v-btn color="primary" @click="createDetailedItem">Create with fields</v-btn>
                <v-btn text @click="cancelCreateMode">Cancel</v-btn>
              </div>
            </v-col>
          </v-row>
          <v-list>
            <v-list-item v-for="it in pickerItems" :key="it.path" @click="performPick(it)" clickable>
              <v-list-item-content>
                <v-list-item-title>{{ it.name || it.path }}</v-list-item-title>
                <v-list-item-subtitle v-if="it.retired">(retired)</v-list-item-subtitle>
              </v-list-item-content>
            </v-list-item>
          </v-list>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn text @click="closePicker">Close</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="5000">
      {{ snackbar.text }}
      <template #actions>
        <v-btn text @click="snackbar.show = false">Close</v-btn>
      </template>
    </v-snackbar>

  </v-app>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, watch } from 'vue'
import TeamDAO from '@/dao/TeamDAO'
import CompetitionDAO from '@/dao/CompetitionDAO'
import SeasonDAO from '@/dao/SeasonDAO'
import VenueDAO from '@/dao/VenueDAO'
import TextDAO from '@/dao/TextDAO'
import UserDAO from '@/dao/UserDAO'
import ApplicationContextDAO from '@/dao/ApplicationContextDAO'
import GlobalTextDAO from '@/dao/GlobalTextDAO'
import { nextTick } from 'vue'
import { useKey } from '@/services/KeyService'
import PathField from './PathField.vue'
import UsersEditor from './UsersEditor.vue'
import EmailAliasesEditor from './EmailAliasesEditor.vue'
import CompetitionEditor from './CompetitionEditor.vue'

const drawer = ref(true)

const entityTypes = [
  { key: 'team', label: 'Teams', dao: TeamDAO },
  { key: 'competition', label: 'Competitions', dao: CompetitionDAO },
  { key: 'season', label: 'Seasons', dao: SeasonDAO },
  { key: 'venue', label: 'Venues', dao: VenueDAO },
  { key: 'text', label: 'Texts', dao: TextDAO },
  { key: 'user', label: 'Users', dao: UserDAO },
  { key: 'appcontext', label: 'App Context', dao: ApplicationContextDAO },
]

const selectedType = ref<typeof entityTypes[0] | null>(entityTypes[0])
const items = ref<any[]>([])
const selectedItem = ref<any | null>(null)
const loading = ref(false)
// picker dialog state
const pickerOpen = ref(false)
const pickerTitle = ref('')
const pickerItems = ref<any[]>([])
const pickerField = ref('')
const pickerMultiple = ref(false)
const pickerDao = ref<any | null>(null)
const pickerNewName = ref('')
const pickerCreateMode = ref(false)
const pickerCreateData = ref<any>({})
const { encode: encodeKey } = useKey()
// forms & validation
const detailsForm = ref<any | null>(null)
const pickerCreateForm = ref<any | null>(null)

const requiredRule = (v: any) => (v !== undefined && v !== null && String(v).trim() !== '') || 'Required'
const emailRule = (v: any) => (!v || /\S+@\S+\.\S+/.test(v)) || 'Invalid email'
const numberRule = (v: any) => (v === undefined || v === null || v === '' || !Number.isNaN(Number(v))) || 'Must be numeric'

const loadList = async (type: any) => {
  loading.value = true
  try {
    const list = await type.dao.list()
    items.value = list || []
  } finally {
    loading.value = false
  }
}

const selectType = (type: any) => {
  selectedType.value = type
  selectedItem.value = null
  loadList(type)
}

const selectItem = (item: any) => {
  // shallow clone to edit
  selectedItem.value = JSON.parse(JSON.stringify(item))
}

const openPicker = async (field: string, daoKey: string, multiple = false) => {
  if (!selectedItem.value) return
  pickerOpen.value = true
  pickerField.value = field
  pickerMultiple.value = multiple
  pickerTitle.value = `Choose ${field}`
  // pick DAO by key
  let dao: any
  switch (daoKey) {
    case 'venue':
      dao = VenueDAO
      break
    case 'text':
      dao = TextDAO
      break
    case 'user':
      dao = UserDAO
      break
    case 'season':
      dao = SeasonDAO
      break
    case 'globaltext':
      dao = GlobalTextDAO
      break
    default:
      dao = null
  }
  pickerDao.value = dao
  if (dao) {
    pickerItems.value = (await dao.list()) || []
  } else {
    pickerItems.value = []
  }
}

const performPick = (item: any) => {
  if (!selectedItem.value) return
  const p = pathValue(item)
  if (pickerMultiple.value) {
    const field = pickerField.value
    if (!selectedItem.value[field]) selectedItem.value[field] = []
    selectedItem.value[field].push({ path: p })
  } else {
    selectedItem.value[pickerField.value] = { path: p }
  }
  pickerOpen.value = false
}

const removeUser = (idx: number) => {
  if (!selectedItem.value?.users) return
  const removed = selectedItem.value.users[idx]
  const removedPath = pathValue(removed)
  selectedItem.value.users.splice(idx, 1)
  showSnackbar(`Removed user ${removedPath} (remember to Save)`, 'info')
}

const removeEmailAlias = (idx: number) => {
  if (!selectedItem.value?.emailAliases) return
  const removed = selectedItem.value.emailAliases[idx]
  const removedAlias = removed?.alias || ''
  const removedPath = pathValue(removed?.user)
  selectedItem.value.emailAliases.splice(idx, 1)
  showSnackbar(`Removed alias ${removedAlias}::${removedPath} (remember to Save)`, 'info')
}

const createNewItem = async () => {
  if (!pickerDao.value) return
  const dao = pickerDao.value
  const name = pickerNewName.value.trim() || 'New'
  // generate a deterministic id from the name when possible
  const base = dao.entity || 'item'
  const encoded = encodeKey(name) || `${Date.now()}`
  const path = `${base}/${encoded}`
  const entity: any = { name, path }
  // add sensible defaults
  if (base === 'venue') entity.retired = false
  if (base === 'team') entity.retired = false
  if (base === 'user') entity.retired = false
  try {
    await dao.save(entity)
    // refresh picker list and select the new one
    pickerItems.value = (await dao.list()) || []
    await nextTick()
    const created = pickerItems.value.find((i: any) => i.path === path)
    if (created) performPick(created)
    pickerNewName.value = ''
    const label = entityTypes.find((t: any) => t.key === base)?.label || base
    showSnackbar(`Created ${label} '${name}' (${path})`, 'success')
  } catch (e) {
    const msg = e?.message ?? String(e)
    showSnackbar(`Create failed: ${msg}`, 'error')
  }
}

const cancelCreateMode = () => {
  pickerCreateMode.value = false
  pickerCreateData.value = {}
}

const createDetailedItem = async () => {
  if (!pickerDao.value) return
  // validate create form
  if (pickerCreateForm.value && typeof pickerCreateForm.value.validate === 'function') {
    const ok = await pickerCreateForm.value.validate()
    if (!ok) return
  }
  const dao = pickerDao.value
  const data = { ...(pickerCreateData.value || {}) }
  const name = (data.name && String(data.name).trim()) || 'New'
  const base = dao.entity || 'item'
  const encoded = encodeKey(name) || `${Date.now()}`
  const path = `${base}/${encoded}`
  data.path = path
  // ensure required defaults
  if (base === 'venue') data.retired = data.retired ?? false
  if (base === 'team') data.retired = data.retired ?? false
  if (base === 'user') data.retired = data.retired ?? false
  try {
    await dao.save(data)
    pickerItems.value = (await dao.list()) || []
    await nextTick()
    const created = pickerItems.value.find((i: any) => i.path === path)
    if (created) performPick(created)
    pickerCreateMode.value = false
    pickerCreateData.value = {}
    pickerNewName.value = ''
    const label = entityTypes.find((t: any) => t.key === base)?.label || base
    showSnackbar(`Created ${label} '${name}' (${path})`, 'success')
  } catch (e) {
    const msg = e?.message ?? String(e)
    showSnackbar(`Create failed: ${msg}`, 'error')
  }
}

const closePicker = () => {
  pickerOpen.value = false
}

const saveItem = async () => {
  if (!selectedItem.value || !selectedType.value) return
  // validate details form if present
  if (detailsForm.value && typeof detailsForm.value.validate === 'function') {
    const ok = await detailsForm.value.validate()
    if (!ok) return
  }
  try {
    // normalize path-like fields and arrays before saving
    normalizeBeforeSave(selectedType.value.key, selectedItem.value)
    await selectedType.value.dao.save(selectedItem.value)
    await loadList(selectedType.value)
    // reselect updated item
    const fresh = items.value.find((i: any) => i.path === selectedItem.value.path)
    if (fresh) selectItem(fresh)
    // show success
    const label = selectedType.value.label || selectedType.value.key
    const name = selectedItem.value?.name || ''
    const path = selectedItem.value?.path || ''
    showSnackbar(`Saved ${label} '${name}' (${path})`, 'success')
  } catch (e) {
    // show error to user
    const msg = e?.message ?? String(e)
    showSnackbar(`Save failed: ${msg}`, 'error')
  }
}

const reloadList = async () => {
  if (selectedType.value) await loadList(selectedType.value)
}

// snackbar state
const snackbar = ref({ show: false, text: '', color: 'success' })

const showSnackbar = (text: string, color = 'success') => {
  snackbar.value.text = text
  snackbar.value.color = color
  snackbar.value.show = true
}

onMounted(() => {
  if (selectedType.value) loadList(selectedType.value)
})

watch(selectedType, (t) => {
  if (t) loadList(t)
})

const isType = (k: string) => selectedType.value?.key === k

const pathValue = (obj: any) => {
  if (!obj) return ''
  return obj.path ?? obj.id ?? ''
}

const setPathValue = (field: string, val: string) => {
  if (!selectedItem.value) return
  selectedItem.value[field] = val ? { path: val } : undefined
}

const usersAsLines = computed(() => {
  if (!selectedItem.value || !selectedItem.value.users) return ''
  return selectedItem.value.users.map((u: any) => pathValue(u)).join('\n')
})

const setUsersFromLines = (val: string) => {
  if (!selectedItem.value) return
  const lines = val.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
  selectedItem.value.users = lines.map((l) => ({ path: l }))
}

const emailAliasesAsLines = computed(() => {
  if (!selectedItem.value || !selectedItem.value.emailAliases) return ''
  return selectedItem.value.emailAliases.map((a: any) => `${a.alias}::${pathValue(a.user)}`).join('\n')
})

const setEmailAliasesFromLines = (val: string) => {
  if (!selectedItem.value) return
  const lines = val.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
  selectedItem.value.emailAliases = lines.map((l) => {
    const [alias, path] = l.split('::').map((s) => s.trim())
    return { alias: alias || '', user: path ? { path } : undefined }
  })
}

const normalizeBeforeSave = (typeKey: string, item: any) => {
  if (!item) return
  const normPath = (f: string) => {
    if (!item[f]) return
    if (typeof item[f] === 'string') item[f] = { path: item[f] }
  }

  if (typeKey === 'team') {
    normPath('venue')
    normPath('text')
    if (typeof item.users === 'string') setUsersFromLines(item.users)
    if (Array.isArray(item.users)) item.users = item.users.map((u: any) => (typeof u === 'string' ? { path: u } : u))
  }
  if (typeKey === 'competition') {
    normPath('text')
  }
  if (typeKey === 'season') {
    normPath('text')
  }
  if (typeKey === 'appcontext') {
    normPath('textSet')
    normPath('currentSeason')
    if (typeof item.emailAliases === 'string') {
      // parse lines
      const lines = item.emailAliases.split(/\r?\n/).map((l: string) => l.trim()).filter(Boolean)
      item.emailAliases = lines.map((l: string) => {
        const [alias, path] = l.split('::').map((s: string) => s.trim())
        return { alias: alias || '', user: path ? { path } : undefined }
      })
    }
  }
}

</script>

<script lang="ts">
// helper functions outside setup to keep template tidy
export { }
</script>
