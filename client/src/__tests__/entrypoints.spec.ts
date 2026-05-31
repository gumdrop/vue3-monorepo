import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => {
  const app = {
    mount: vi.fn(),
    use: vi.fn(),
  }
  app.use.mockReturnValue(app)

  return {
    app,
    connectFirestoreEmulator: vi.fn(),
    createApp: vi.fn(() => app),
    createPinia: vi.fn(() => ({ name: 'pinia' })),
    firestore: { name: 'firestore' },
    initializeApp: vi.fn(() => ({ name: 'firebase-app' })),
    isLocalHost: vi.fn(),
    mainRouter: { name: 'main-router' },
    maintainRouter: { name: 'maintain-router' },
    vuetify: { name: 'vuetify' },
    VueFire: { name: 'VueFire' },
    VueFireAuth: vi.fn(() => ({ name: 'VueFireAuth' })),
    VueShowdownPlugin: { name: 'VueShowdownPlugin' },
  }
})

vi.mock('vue', () => ({
  createApp: mocks.createApp,
}))

vi.mock('pinia', () => ({
  createPinia: mocks.createPinia,
}))

vi.mock('@firebase/app', () => ({
  initializeApp: mocks.initializeApp,
}))

vi.mock('@firebase/firestore', () => ({
  connectFirestoreEmulator: mocks.connectFirestoreEmulator,
  getFirestore: vi.fn(() => mocks.firestore),
}))

vi.mock('vuefire', () => ({
  VueFire: mocks.VueFire,
  VueFireAuth: mocks.VueFireAuth,
}))

vi.mock('vue-showdown', () => ({
  VueShowdownPlugin: mocks.VueShowdownPlugin,
}))

vi.mock('../utils/localHost', () => ({
  isLocalHost: mocks.isLocalHost,
}))

vi.mock('@/utils/localHost', () => ({
  isLocalHost: mocks.isLocalHost,
}))

vi.mock('@/plugins/vuetify', () => ({
  default: mocks.vuetify,
}))

vi.mock('../site/components/App.vue', () => ({
  default: { name: 'SiteApp' },
}))

vi.mock('../site/router', () => ({
  default: mocks.mainRouter,
}))

vi.mock('../maintain/App.vue', () => ({
  default: { name: 'MaintainApp' },
}))

vi.mock('../maintain/router', () => ({
  default: mocks.maintainRouter,
}))

describe('client entrypoints', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
    mocks.app.use.mockReturnValue(mocks.app)
    vi.spyOn(console, 'log').mockImplementation(() => undefined)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('boots the public site app and connects to Firestore emulator on localhost', async () => {
    mocks.isLocalHost.mockReturnValue(true)

    await import('../main')

    expect(mocks.initializeApp).toHaveBeenCalledWith(
      expect.objectContaining({
        projectId: 'chiltern-ql-firestore',
      }),
    )
    expect(mocks.connectFirestoreEmulator).toHaveBeenCalledWith(mocks.firestore, '127.0.0.1', 18080)
    expect(mocks.createApp).toHaveBeenCalledWith({ name: 'SiteApp' })
    expect(mocks.app.use).toHaveBeenCalledWith(mocks.VueFire, {
      firebaseApp: { name: 'firebase-app' },
      modules: [{ name: 'VueFireAuth' }],
    })
    expect(mocks.app.use).toHaveBeenCalledWith({ name: 'pinia' })
    expect(mocks.app.use).toHaveBeenCalledWith(mocks.mainRouter)
    expect(mocks.app.use).toHaveBeenCalledWith(mocks.vuetify)
    expect(mocks.app.use).toHaveBeenCalledWith(mocks.VueShowdownPlugin, { flavor: 'github' })
    expect(mocks.app.mount).toHaveBeenCalledWith('#app')
  })

  it('boots the maintenance app with the maintenance router', async () => {
    mocks.isLocalHost.mockReturnValue(true)

    await import('../maintain/index')

    expect(mocks.connectFirestoreEmulator).toHaveBeenCalledWith(mocks.firestore, '127.0.0.1', 18080)
    expect(mocks.createApp).toHaveBeenCalledWith({ name: 'MaintainApp' })
    expect(mocks.app.use).toHaveBeenCalledWith(mocks.maintainRouter)
    expect(mocks.app.mount).toHaveBeenCalledWith('#app')
  })

  it('does not connect the emulator away from localhost', async () => {
    mocks.isLocalHost.mockReturnValue(false)

    await import('../main')

    expect(mocks.connectFirestoreEmulator).not.toHaveBeenCalled()
    expect(mocks.app.mount).toHaveBeenCalledWith('#app')
  })
})
