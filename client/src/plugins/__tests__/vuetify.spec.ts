import { describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  plugin: { name: 'vuetify-plugin' },
}))

vi.mock('vuetify', () => ({
  createVuetify: vi.fn(() => mocks.plugin),
}))

import { createVuetify } from 'vuetify'

describe('vuetify plugin', () => {
  it('configures the application display breakpoints', async () => {
    const vuetify = (await import('../vuetify')).default

    expect(vuetify).toBe(mocks.plugin)
    expect(createVuetify).toHaveBeenCalledWith({
      display: {
        thresholds: {
          md: 960,
          lg: 1280,
          xl: 1920,
          xxl: 2560,
        },
      },
    })
  })
})
