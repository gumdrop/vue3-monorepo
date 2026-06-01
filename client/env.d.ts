/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_FIRESTORE_EMULATOR_HOST?: string
  readonly VITE_FIRESTORE_EMULATOR_PORT?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
