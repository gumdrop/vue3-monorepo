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
    vi.doUnmock('../endpoint/NotificationEndpoints')

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

  const importServerWithMocks = async (
    options: { builtRootExists?: boolean; port?: string; emulatorHost?: string } = {},
  ) => {
    if (options.port === undefined) {
      delete process.env['PORT']
    } else {
      process.env['PORT'] = options.port
    }

    if (options.emulatorHost === undefined) {
      delete process.env['FIRESTORE_EMULATOR_HOST']
    } else {
      process.env['FIRESTORE_EMULATOR_HOST'] = options.emulatorHost
    }

    const configureSite = vi.fn()
    const configureCalendar = vi.fn()
    const configureMaintain = vi.fn()
    const configureNotifications = vi.fn()
    const useCalls: unknown[][] = []
    let app: {
      use: ReturnType<typeof vi.fn>
      listen: ReturnType<typeof vi.fn>
    }
    app = {
      use: vi.fn((...args: unknown[]) => {
        useCalls.push(args)
        return app
      }),
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
        existsSync: vi.fn(() => options.builtRootExists ?? true),
      }
    })
    vi.doMock('../endpoint/SiteEndpoints', () => ({ default: configureSite }))
    vi.doMock('../endpoint/CalendarEndpoints', () => ({ default: configureCalendar }))
    vi.doMock('../endpoint/MaintainEndpoints', () => ({ default: configureMaintain }))
    vi.doMock('../endpoint/NotificationEndpoints', () => ({ default: configureNotifications }))
    vi.spyOn(console, 'log').mockImplementation(() => undefined)

    const server = await import('../index')

    return { app, configureCalendar, configureMaintain, configureSite, configureNotifications, express, server, useCalls }
  }

  it('exports environment helpers and configures the express app without starting real IO', async () => {
    const { app, configureCalendar, configureMaintain, configureSite, configureNotifications, express, server } =
      await importServerWithMocks({
        port: '9000',
        emulatorHost: '127.0.0.1:8080',
      })

    expect(server.isLocal()).toBe('127.0.0.1:8080')
    expect(server.emulatorAddr()).toBe('127.0.0.1:8080')
    expect(express.static).toHaveBeenCalledWith(expect.stringContaining('deploy/built'))
    expect(configureSite).toHaveBeenCalledWith(app)
    expect(configureCalendar).toHaveBeenCalledWith(app)
    expect(configureMaintain).toHaveBeenCalledWith(app)
    expect(configureNotifications).toHaveBeenCalledWith(app)
    expect(app.use).toHaveBeenCalledWith('/rest', expect.any(Function))
    expect(app.listen).toHaveBeenCalledWith('9000')
    expect(console.log).toHaveBeenCalledWith('Running against Firestore emulator at 127.0.0.1:8080')
    expect(console.log).toHaveBeenCalledWith('Server started on port 9000')
  })

  it('parses raw request bodies, serves app indexes and reports unknown REST routes', async () => {
    const { useCalls } = await importServerWithMocks({
      port: '9000',
      emulatorHost: '127.0.0.1:8080',
    })
    const bodyParser = useCalls.find(
      (args) => args.length === 1 && typeof args[0] === 'function',
    )?.[0] as ((req: Request, res: Response, next: () => void) => void) | undefined
    const restFallback = useCalls.find((args) => args[0] === '/rest')?.[1] as
      | ((req: Request, res: Response) => void)
      | undefined
    const indexMapping = useCalls.find((args) => args[0] === '/')?.[1] as
      | ((req: Request, res: Response) => void)
      | undefined

    expect(bodyParser).toBeDefined()
    expect(restFallback).toBeDefined()
    expect(indexMapping).toBeDefined()

    const handlers = new Map<string, (chunk?: string) => void>()
    const req = {
      body: undefined,
      setEncoding: vi.fn(),
      on: vi.fn((event: string, handler: (chunk?: string) => void) => {
        handlers.set(event, handler)
      }),
    } as unknown as Request
    const next = vi.fn()

    bodyParser!(req, {} as Response, next)
    handlers.get('data')?.('{"fixtureSetPath":"fixtures/week-1"}')
    handlers.get('end')?.()

    expect(req.setEncoding).toHaveBeenCalledWith('utf8')
    expect(req.body).toBe('{"fixtureSetPath":"fixtures/week-1"}')
    expect(next).toHaveBeenCalled()

    const response = {
      sendFile: vi.fn(),
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as unknown as Response

    indexMapping!({ originalUrl: '/maintain/season' } as Request, response)
    indexMapping!({ originalUrl: '/team' } as Request, response)
    restFallback!({ method: 'POST', originalUrl: '/rest/missing' } as Request, response)

    expect(response.sendFile).toHaveBeenCalledWith(expect.stringContaining('maintain/index.html'))
    expect(response.sendFile).toHaveBeenCalledWith(expect.stringContaining('index.html'))
    expect(response.status).toHaveBeenCalledWith(404)
    expect(response.json).toHaveBeenCalledWith({
      error: 'Unknown REST endpoint: POST /rest/missing',
    })
  })

  it('falls back to the default port and skips emulator logging when not local', async () => {
    const { app, server } = await importServerWithMocks({
      builtRootExists: false,
      emulatorHost: undefined,
      port: undefined,
    })

    expect(server.isLocal()).toBeUndefined()
    expect(app.listen).toHaveBeenCalledWith('8000')
    expect(console.log).not.toHaveBeenCalledWith(
      expect.stringContaining('Running against Firestore emulator'),
    )
    expect(console.log).toHaveBeenCalledWith('Server started on port 8000')
  })
})
