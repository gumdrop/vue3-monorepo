import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import vuetify from '@/plugins/vuetify'

import { VueFire, VueFireAuth } from 'vuefire'
import { initializeApp } from '@firebase/app'
import { connectFirestoreEmulator, getFirestore } from '@firebase/firestore'
import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'
import { VueShowdownPlugin } from 'vue-showdown'
import { isLocalHost } from '@/utils/localHost'

const firebaseApp = initializeApp({
  apiKey: 'AIzaSyBs6LpcOSpLMlKlzw0aPB6Ie-39mqlKrm8',
  authDomain: 'chiltern-ql-firestore.firebaseapp.com',
  databaseURL: 'https://chiltern-ql-firestore.firebaseio.com',
  projectId: 'chiltern-ql-firestore',
  storageBucket: 'chiltern-ql-firestore.appspot.com',
  messagingSenderId: '891716942638',
})

const firestore = getFirestore(firebaseApp)

if (isLocalHost(window.location.hostname)) {
  const emulatorHost = import.meta.env.VITE_FIRESTORE_EMULATOR_HOST ?? '127.0.0.1'
  const emulatorPort = Number(import.meta.env.VITE_FIRESTORE_EMULATOR_PORT ?? '18080')
  connectFirestoreEmulator(firestore, emulatorHost, emulatorPort)
}

const app = createApp(App)
app.use(VueFire, {
  firebaseApp,
  modules: [VueFireAuth()],
})

app.use(createPinia())
app.use(router)
app.use(vuetify)
app.use(VueShowdownPlugin, { flavor: 'github' })

app.mount('#app')
