import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const originalPort = process.env['PORT']
const originalEmulatorHost = process.env['FIRESTORE_EMULATOR_HOST']

describe('server index', () => {
  beforeEach(() => {
    vi.resetModules()
    process.env['PORT'] = '9000'
    process.env['FIRESTORE_EMULATOR_HOST'] = '127.0.0.1:8080'
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.doUnmock('express')
    vi.doUnmock('node:fs')
    vi.doUnmock('../endpoint/SiteEndpoints')
    vi.doUnmock('../endpoint/CalendarEndpoints')
    vi.doUnmock('../endpoint/MaintainEndpoints')

    if (originalPort === undefined) {
      delete process.env['PORT']
    } else {
      process.env['PORT'] = originalPort
    }

    if (originalEmulatorHost === undefined) {
      delete process.env['FIRESTORE_EMULATOR_HOST']
    } else {
      process.env['FIRESTORE_EMULATOR_HOST'] = originalEmulatorHost
    }
  })

  it('exports environment helpers and configures the express app without starting real IO', async () => {
    const configureSite = vi.fn()
    const configureCalendar = vi.fn()
    const configureMaintain = vi.fn()
    let app: {
      use: ReturnType<typeof vi.fn>
      listen: ReturnType<typeof vi.fn>
    }
    app = {
      use: vi.fn(() => app),
      listen: vi.fn(() => app),
    }
    const express = vi.fn(() => app) as ReturnType<typeof vi.fn> & {
      static: ReturnType<typeof vi.fn>
    }
    express.static = vi.fn(() => 'static-middleware')

    vi.doMock('express', () => ({ default: express }))
    vi.doMock('node:fs', async () => {
      const actual = await vi.importActual<typeof import('node:fs')>('node:fs')
      return {
        ...actual,
        existsSync: vi.fn(() => true),
      }
    })
    vi.doMock('../endpoint/SiteEndpoints', () => ({ default: configureSite }))
    vi.doMock('../endpoint/CalendarEndpoints', () => ({ default: configureCalendar }))
    vi.doMock('../endpoint/MaintainEndpoints', () => ({ default: configureMaintain }))
    vi.spyOn(console, 'log').mockImplementation(() => undefined)

    const server = await import('../index')

    expect(server.isLocal()).toBe('127.0.0.1:8080')
    expect(server.emulatorAddr()).toBe('127.0.0.1:8080')
    expect(express.static).toHaveBeenCalledWith(expect.stringContaining('deploy/built'))
    expect(configureSite).toHaveBeenCalledWith(app)
    expect(configureCalendar).toHaveBeenCalledWith(app)
    expect(configureMaintain).toHaveBeenCalledWith(app)
    expect(app.use).toHaveBeenCalledWith('/rest', expect.any(Function))
    expect(app.listen).toHaveBeenCalledWith('9000')
    expect(console.log).toHaveBeenCalledWith(
      'Running against Firestore emulator at 127.0.0.1:8080',
    )
    expect(console.log).toHaveBeenCalledWith('Server started on port 9000')
  })
})
