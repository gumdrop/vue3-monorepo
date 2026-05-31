import type { Application, Request, Response } from 'express'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import configureCalendar from '../CalendarEndpoints'
import { teamCalendar } from '../CalendarHandler'
import { sendText } from '../util'

vi.mock('../CalendarHandler', () => ({
  teamCalendar: vi.fn().mockResolvedValue('BEGIN:VCALENDAR\nEND:VCALENDAR\n'),
}))

vi.mock('../util', () => ({
  param: vi.fn((name: string, req: Request) => req.params[name]),
  sendText: vi.fn((result: unknown, res: Response) => {
    Promise.resolve(result).then((value) => res.send(value))
  }),
}))

type RouteHandler = (req: Request, res: Response) => void

const createApp = () => {
  const routes = new Map<string, RouteHandler>()
  const app = {} as {
    get: ReturnType<typeof vi.fn>
  }

  app.get = vi.fn((path: string, handler: RouteHandler) => {
    routes.set(`GET ${path}`, handler)
    return app
  })

  return { app: app as unknown as Application, routes }
}

const flushPromises = () => new Promise((resolve) => setTimeout(resolve, 0))

describe('CalendarEndpoints', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('routes team calendar requests to the calendar handler as text/calendar', async () => {
    const { app, routes } = createApp()
    configureCalendar(app)

    const response = {
      contentType: vi.fn().mockReturnThis(),
      send: vi.fn(),
    } as unknown as Response

    routes.get('GET /calendar/team/:teamId')?.(
      { params: { teamId: 'team-1' } } as unknown as Request,
      response,
    )
    await flushPromises()

    expect(teamCalendar).toHaveBeenCalledWith('team-1')
    expect(response.contentType).toHaveBeenCalledWith('text/calendar')
    expect(sendText).toHaveBeenCalledWith(expect.any(Promise), response)
    expect(response.send).toHaveBeenCalledWith('BEGIN:VCALENDAR\nEND:VCALENDAR\n')
  })
})
