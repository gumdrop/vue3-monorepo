import { ref } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useDialog } from '../DialogService'
import { useLayout } from '../LayoutService'

const mocks = vi.hoisted(() => ({
  display: {
    smAndDown: undefined as unknown,
    xs: undefined as unknown,
  },
}))

vi.mock('vuetify', () => ({
  useDisplay: () => mocks.display,
}))

describe('display-backed services', () => {
  beforeEach(() => {
    mocks.display.smAndDown = ref(false)
    mocks.display.xs = ref(false)
  })

  it('passes Vuetify small-screen state through to dialog sizing', () => {
    mocks.display.smAndDown = ref(true)

    expect(useDialog().dialogSize()).toEqual({ fullscreen: mocks.display.smAndDown })
  })

  it('uses compact grid spacing on extra-small displays', () => {
    mocks.display.xs = ref(true)

    expect(useLayout().gridSize.value).toBe('px-0 py-1')
  })

  it('uses default grid spacing outside extra-small displays', () => {
    expect(useLayout().gridSize.value).toBe('')
  })
})
