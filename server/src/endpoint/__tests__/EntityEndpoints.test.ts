import type { Application, Request, Response } from 'express'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import configure from '../EntityEndpoints'
import { recalculateTable, regenerateStats } from '../EntityFunctions'

vi.mock('../EntityFunctions', () => ({
  recalculateTable: vi.fn().mockResolvedValue(undefined),
  regenerateStats: vi.fn().mockResolvedValue(undefined),
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
  }

  app.post = vi.fn((path: string, handler: RouteHandler) => {
    routes.set(`POST ${path}`, handler)
    return app
  })

  return { app: app as unknown as Application, routes }
}

const flushPromises = () => new Promise((resolve) => setTimeout(resolve, 0))

describe('EntityEndpoints', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('routes statistics regeneration requests to the entity function', async () => {
    const { app, routes } = createApp()
    configure(app)

    const response = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis(),
      send: vi.fn(),
    } as unknown as Response

    routes.get('POST /rest/entity/regenerate-stats/:seasonId')?.(
      { params: { seasonId: 'season-1' } } as unknown as Request,
      response,
    )
    await flushPromises()

    expect(regenerateStats).toHaveBeenCalledWith('season-1')
    expect(response.json).toHaveBeenCalledWith(undefined)
  })

  it('routes table recalculation requests using the request body path', async () => {
    const { app, routes } = createApp()
    configure(app)

    const response = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis(),
      send: vi.fn(),
    } as unknown as Response

    routes.get('POST /rest/entity/recalculate-table')?.(
      { body: Buffer.from('season/season-1/competition/league/leaguetable/table-1') } as Request,
      response,
    )
    await flushPromises()

    expect(recalculateTable).toHaveBeenCalledWith(
      'season/season-1/competition/league/leaguetable/table-1',
    )
    expect(response.json).toHaveBeenCalledWith(undefined)
  })
})
