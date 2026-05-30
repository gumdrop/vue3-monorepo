import type { Application, Request, Response } from 'express'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import configure from '../SiteEndpoints'
import { resultSubmission } from '../TaskFunctions'

vi.mock('../TaskFunctions', () => ({
  resultSubmission: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('../SiteFunctions', () => ({
  siteUserForEmail: vi.fn(),
}))

vi.mock('../util', () => ({
  param: vi.fn((name: string, req: Request) => req.params[name]),
  send: vi.fn((result: unknown, res: Response) => {
    Promise.resolve(result).then((value) => res.json(value))
  }),
}))

type RouteHandler = (req: Request, res: Response) => void

const createApp = () => {
  const routes = new Map<string, RouteHandler>()
  const app = {} as {
    post: ReturnType<typeof vi.fn>
    get: ReturnType<typeof vi.fn>
  }

  app.post = vi.fn((path: string, handler: RouteHandler) => {
    routes.set(`POST ${path}`, handler)
    return app
  })
  app.get = vi.fn((path: string, handler: RouteHandler) => {
    routes.set(`GET ${path}`, handler)
    return app
  })

  return { app: app as unknown as Application, routes }
}

const flushPromises = () => new Promise((resolve) => setTimeout(resolve, 0))

describe('SiteEndpoints', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('routes result submissions to the task function', async () => {
    const { app, routes } = createApp()
    configure(app)

    const command = {
      fixtures: [
        {
          fixturePath: 'season/season-1/competition/league/fixtures/week-1/fixture/fixture-1',
          homeScore: 3,
          awayScore: 2,
        },
      ],
      reportText: 'Report text',
      userID: 'user-1',
    }
    const response = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis(),
      send: vi.fn(),
    } as unknown as Response

    routes.get('POST /rest/site/result/submit')?.(
      { body: JSON.stringify(command) } as Request,
      response,
    )
    await flushPromises()

    expect(resultSubmission).toHaveBeenCalledWith(command)
    expect(response.json).toHaveBeenCalledWith({ ok: true })
  })
})
