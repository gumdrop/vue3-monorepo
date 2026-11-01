import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  chart: {
    defaults: {
      color: '',
      borderColor: '',
    },
  },
}))

vi.mock('chart.js/auto', () => ({
  Chart: mocks.chart,
}))

const mediaListeners = new Map<string, (event: { matches: boolean }) => void>()

function stubMatchMedia(matches: boolean) {
  const media = {
    matches,
    addEventListener: (type: string, listener: (event: { matches: boolean }) => void) => {
      mediaListeners.set(type, listener)
    },
  }
  window.matchMedia = vi.fn().mockReturnValue(media) as unknown as typeof window.matchMedia
}

describe('chart theme', () => {
  beforeEach(() => {
    vi.resetModules()
    mediaListeners.clear()
  })

  it('applies light chart defaults when the system prefers light', async () => {
    stubMatchMedia(false)

    await import('../chart')

    expect(mocks.chart.defaults.color).toBe('#64748b')
    expect(mocks.chart.defaults.borderColor).toBe('rgba(0, 0, 0, 0.1)')
  })

  it('applies dark chart defaults when the system prefers dark', async () => {
    stubMatchMedia(true)

    await import('../chart')

    expect(mocks.chart.defaults.color).toBe('#94a3b8')
    expect(mocks.chart.defaults.borderColor).toBe('rgba(148, 163, 184, 0.15)')
  })

  it('updates chart defaults when the system theme changes', async () => {
    stubMatchMedia(false)

    await import('../chart')

    const listener = mediaListeners.get('change')
    expect(listener).toBeDefined()
    listener?.({ matches: true })

    expect(mocks.chart.defaults.color).toBe('#94a3b8')
    expect(mocks.chart.defaults.borderColor).toBe('rgba(148, 163, 184, 0.15)')
  })
})
