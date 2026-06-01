/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_FIRESTORE_EMULATOR_HOST?: string
  readonly VITE_FIRESTORE_EMULATOR_PORT?: string
  readonly VITE_MAINTAIN_AUTH_BYPASS?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
