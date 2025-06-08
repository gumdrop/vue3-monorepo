import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import { createVuetify } from 'vuetify'

import { VueFire, VueFireAuth } from 'vuefire'
import { initializeApp } from '@firebase/app'
import { connectFirestoreEmulator, getFirestore } from '@firebase/firestore'
import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'
import '@/assets/main.css'
import { VueShowdownPlugin } from 'vue-showdown'

const firebaseApp = initializeApp({
  // your application settings object Connection{
  apiKey: 'AIzaSyBs6LpcOSpLMlKlzw0aPB6Ie-39mqlKrm8',
  authDomain: 'chiltern-ql-firestore.firebaseapp.com',
  databaseURL: 'https://chiltern-ql-firestore.firebaseio.com',
  projectId: 'chiltern-ql-firestore',
  storageBucket: 'chiltern-ql-firestore.appspot.com',
  messagingSenderId: '891716942638',
})

console.log('got firestore')

const firestore = getFirestore(firebaseApp)

if (window.location.hostname == 'localhost') {
  connectFirestoreEmulator(firestore, 'localhost', 8080)
}

const app = createApp(App)
app.use(VueFire, {
  // imported above but could also just be created here
  firebaseApp,
  modules: [
    // we will see other modules later on
    VueFireAuth(),
  ],
})

app.use(createPinia())
app.use(router)
app.use(createVuetify())
app.use(VueShowdownPlugin, { flavor: 'github' })

app.mount('#app')
