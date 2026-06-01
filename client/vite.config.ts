import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import vuetify from 'vite-plugin-vuetify'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueJsx(),
    vuetify({
      autoImport: true,
      styles: { configFile: 'src/settings/vuetify.scss' },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    rollupOptions: {
      input: [resolve(__dirname, './index.html'), resolve(__dirname, './maintain/index.html')],
    },
  },
  server: {
    proxy: {
      '/rest': 'http://localhost:8000',
    },
  },
})
