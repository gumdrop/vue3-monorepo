import type { Application, Request, Response } from 'express'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import configureNotifications from '../NotificationEndpoints'
import { notificationService } from '../NotificationService'

type RouteHandler = (req: Request, res: Response) => void

const createApp = () => {
  const routes = new Map<string, RouteHandler>()
  const app = {} as {
    get: ReturnType<typeof vi.fn>
    post: ReturnType<typeof vi.fn>
  }

  app.get = vi.fn((path: string, handler: RouteHandler) => {
    routes.set(`GET ${path}`, handler)
    return app
  })

  app.post = vi.fn((path: string, handler: RouteHandler) => {
    routes.set(`POST ${path}`, handler)
    return app
  })

  return { app: app as unknown as Application, routes }
}

describe('NotificationEndpoints', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useRealTimers()
    // Clear in-memory clients
    const anyService = notificationService as any
    anyService.clients.clear()
  })

  it('allows clients to subscribe to the notification stream and clean up on close', async () => {
    const { app, routes } = createApp()
    configureNotifications(app)

    const callbacks: { [key: string]: () => void } = {}

    const req = {
      query: { siteUserId: 'site-user-123', uid: 'firebase-uid-abc' },
      on: vi.fn((event: string, callback: () => void) => {
        callbacks[event] = callback
      }),
    } as unknown as Request

    const res = {
      writeHead: vi.fn(),
      write: vi.fn(),
      on: vi.fn(),
      end: vi.fn(),
    } as unknown as Response

    routes.get('GET /rest/notifications/stream')?.(req, res)

    expect(res.writeHead).toHaveBeenCalledWith(200, expect.objectContaining({
      'Content-Type': 'text/event-stream',
    }))
    expect(res.write).toHaveBeenCalledWith(':ok\n\n')
    expect(notificationService.getActiveClientCount()).toBe(1)

    // Trigger cleanup
    callbacks['close']?.()
    expect(notificationService.getActiveClientCount()).toBe(0)
    expect(res.end).toHaveBeenCalled()
  })

  it('handles res.end() or res.write() throwing in cleanup and heartbeat', async () => {
    vi.useFakeTimers()
    const { app, routes } = createApp()
    configureNotifications(app)

    const callbacks: { [key: string]: () => void } = {}

    const req = {
      query: { siteUserId: 'site-user-123' },
      on: vi.fn((event: string, callback: () => void) => {
        callbacks[event] = callback
      }),
    } as unknown as Request

    let writeCount = 0
    const res = {
      writeHead: vi.fn(),
      write: vi.fn().mockImplementation(() => {
        writeCount++
        if (writeCount > 1) {
          throw new Error('Write failed')
        }
      }),
      on: vi.fn(),
      end: vi.fn().mockImplementation(() => {
        throw new Error('End failed')
      }),
    } as unknown as Response

    routes.get('GET /rest/notifications/stream')?.(req, res)

    // Trigger interval heartbeat write error
    vi.advanceTimersByTime(30000)

    // Trigger cleanup end error
    callbacks['close']?.()

    expect(notificationService.getActiveClientCount()).toBe(0)
    vi.useRealTimers()
  })

  it('can broadcast a notification to all clients and handles write errors', async () => {
    const { app, routes } = createApp()
    configureNotifications(app)

    const spyConsole = vi.spyOn(console, 'error').mockImplementation(() => {})

    // Register a client that succeeds and one that throws
    const clientRes1 = {
      write: vi.fn(),
    } as unknown as Response
    const clientRes2 = {
      write: vi.fn().mockImplementation(() => {
        throw new Error('Failed to write')
      }),
    } as unknown as Response
    
    notificationService.addClient(clientRes1)
    notificationService.addClient(clientRes2)

    const req = {
      body: {
        target: 'all',
        payload: {
          title: 'Hello Everyone',
          body: 'This is a test broadcast',
        },
      },
    } as unknown as Request

    const res = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis(),
    } as unknown as Response

    routes.get('POST /rest/notifications/send')?.(req, res)

    expect(clientRes1.write).toHaveBeenCalledWith(
      expect.stringContaining('This is a test broadcast')
    )
    expect(clientRes2.write).toHaveBeenCalled()
    expect(spyConsole).toHaveBeenCalled()
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      message: 'Broadcast sent to all clients',
    }))
    
    spyConsole.mockRestore()
  })

  it('can send a targeted notification to specific users and handles targeted write errors', async () => {
    const { app, routes } = createApp()
    configureNotifications(app)

    const spyConsole = vi.spyOn(console, 'error').mockImplementation(() => {})

    // Register clients
    const clientRes1 = {
      write: vi.fn().mockImplementation(() => {
        throw new Error('Failed to write')
      }),
    } as unknown as Response
    const clientRes2 = {
      write: vi.fn(),
    } as unknown as Response

    notificationService.addClient(clientRes1, 'user-abc', 'uid-123')
    notificationService.addClient(clientRes2, 'user-def', 'uid-456')

    const req = {
      body: {
        target: {
          siteUserIds: ['user-abc'],
          uids: ['uid-456'],
        },
        payload: {
          title: 'Targeted Title',
          body: 'Targeted Body',
        },
      },
    } as unknown as Request

    const res = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis(),
    } as unknown as Response

    routes.get('POST /rest/notifications/send')?.(req, res)

    expect(clientRes1.write).toHaveBeenCalled()
    expect(clientRes2.write).toHaveBeenCalledWith(
      expect.stringContaining('Targeted Body')
    )
    expect(spyConsole).toHaveBeenCalled()
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
    }))

    spyConsole.mockRestore()
  })

  it('returns 400 if payload is missing key details', async () => {
    const { app, routes } = createApp()
    configureNotifications(app)

    const req = {
      body: {
        target: 'all',
        payload: {
          title: '',
          body: 'Missing title',
        },
      },
    } as unknown as Request

    const res = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis(),
      send: vi.fn(),
    } as unknown as Response

    routes.get('POST /rest/notifications/send')?.(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ error: 'Payload with title and body is required' })
  })

  it('returns 500 if an internal exception is thrown during processing', async () => {
    const { app, routes } = createApp()
    configureNotifications(app)

    // Force json parsing to throw by passing invalid body representation
    const req = {
      body: 'invalid-json-string{',
    } as unknown as Request

    const res = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis(),
    } as unknown as Response

    routes.get('POST /rest/notifications/send')?.(req, res)

    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      error: expect.any(String),
    }))
  })
})
