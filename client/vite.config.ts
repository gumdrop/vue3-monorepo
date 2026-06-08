import { fileURLToPath, URL } from 'node:url'

import { defineConfig, type Plugin } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import vuetify from 'vite-plugin-vuetify'
import { resolve } from 'path'

const maintainHistoryFallback = (): Plugin => ({
  name: 'maintain-history-fallback',
  configureServer(server) {
    server.middlewares.use((req, _res, next) => {
      const url = req.url ?? ''
      if (isMaintainHistoryRequest(url)) {
        const query = url.includes('?') ? `?${url.split('?').slice(1).join('?')}` : ''
        req.url = `/maintain/${query}`
      }
      next()
    })
  },
})

const isMaintainHistoryRequest = (url: string) => {
  const path = url.split('?')[0]
  return (
    path === '/maintain' ||
    (path.startsWith('/maintain/') && path !== '/maintain/' && !path.split('/').pop()?.includes('.'))
  )
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    maintainHistoryFallback(),
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
