import type { Application, Request, Response } from 'express'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import configure from '../MaintainEndpoints'
import { regenerateFixtureSetResultsSummary } from '../TaskFunctions'

vi.mock('../TaskFunctions', () => ({
  regenerateFixtureSetResultsSummary: vi.fn().mockResolvedValue({
    path: 'season/season-1/competition/league/fixtures/week-1',
    resultsSummary: { id: 'summary-text', path: 'text/summary-text' },
    resultsSummaryGeneratedAt: '2026-05-31T09:00:00.000Z',
    resultsSummaryModel: 'gemini-test',
  }),
}))

vi.mock('../StatisticsUtils', () => ({
  calculateStats: vi.fn(),
}))

vi.mock('../../storage/Storage', () => ({
  entityPath: vi.fn((type: string, id: string) => `${type}/${id}`),
  load: vi.fn().mockResolvedValue({
    id: 'summary-text',
    path: 'text/summary-text',
    text: 'Fresh AI summary',
    mimeType: 'text/markdown',
  }),
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

describe('MaintainEndpoints', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('routes AI summary regeneration to the task function', async () => {
    const { app, routes } = createApp()
    configure(app)

    const response = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis(),
      send: vi.fn(),
    } as unknown as Response

    routes.get('POST /rest/maintain/fixtures/results-summary/regenerate')?.(
      {
        body: JSON.stringify({
          fixtureSetPath: 'season/season-1/competition/league/fixtures/week-1',
        }),
      } as Request,
      response,
    )
    await flushPromises()

    expect(regenerateFixtureSetResultsSummary).toHaveBeenCalledWith(
      'season/season-1/competition/league/fixtures/week-1',
    )
    expect(response.json).toHaveBeenCalledWith({
      fixtureSetPath: 'season/season-1/competition/league/fixtures/week-1',
      resultsSummary: { id: 'summary-text', path: 'text/summary-text' },
      resultsSummaryText: 'Fresh AI summary',
      resultsSummaryGeneratedAt: '2026-05-31T09:00:00.000Z',
      resultsSummaryModel: 'gemini-test',
    })
  })
})
