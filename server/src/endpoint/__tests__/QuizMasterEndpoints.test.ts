import type { Application, Request, Response } from 'express'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import configure from '../QuizMasterEndpoints'
import { generateMatchReport } from '../DeepSeekResultsSummary'
import { acquireQuiz } from '../QuizMasterFunctions'

vi.mock('../QuizMasterFunctions', () => ({
  acquireQuiz: vi.fn(),
}))

vi.mock('../DeepSeekResultsSummary', () => ({
  generateMatchReport: vi.fn(),
}))

vi.mock('../util', () => ({
  send: vi.fn((result: unknown, res: Response) => {
    Promise.resolve(result).then((value) => res.json(value))
  }),
}))

type RouteHandler = (req: Request, res: Response) => void

const createApp = () => {
  const routes = new Map<string, RouteHandler>()
  const app = {} as { post: ReturnType<typeof vi.fn> }

  app.post = vi.fn((path: string, handler: RouteHandler) => {
    routes.set(`POST ${path}`, handler)
    return app
  })

  return { app: app as unknown as Application, routes }
}

const flushPromises = () => new Promise((resolve) => setTimeout(resolve, 0))

describe('QuizMasterEndpoints', () => {
  beforeEach(() => {
    vi.mocked(acquireQuiz).mockReset()
    vi.mocked(generateMatchReport).mockReset()
  })

  it('registers the quiz acquire and report endpoints', () => {
    const { app } = createApp()
    configure(app)

    expect(app.post).toHaveBeenCalledWith('/rest/site/quiz/acquire', expect.any(Function))
    expect(app.post).toHaveBeenCalledWith('/rest/site/quiz/report', expect.any(Function))
  })

  it('acquires a quiz and returns the parsed paper', async () => {
    const paper = { rounds: [] }
    vi.mocked(acquireQuiz).mockResolvedValue(paper)

    const { app, routes } = createApp()
    configure(app)

    const json = vi.fn()
    const handler = routes.get('POST /rest/site/quiz/acquire')!
    handler({ body: JSON.stringify({ fixtureDate: '2026-10-13', password: 'pw' }) } as Request, {
      json,
    } as unknown as Response)

    await flushPromises()

    expect(acquireQuiz).toHaveBeenCalledWith({ fixtureDate: '2026-10-13', password: 'pw' })
    expect(json).toHaveBeenCalledWith(paper)
  })

  it('generates a match report', async () => {
    vi.mocked(generateMatchReport).mockResolvedValue({ text: 'A report', model: 'deepseek-chat' })

    const { app, routes } = createApp()
    configure(app)

    const json = vi.fn()
    const handler = routes.get('POST /rest/site/quiz/report')!
    handler({ body: JSON.stringify({ homeTeam: 'Alpha' }) } as Request, { json } as unknown as Response)

    await flushPromises()

    expect(generateMatchReport).toHaveBeenCalledWith({ homeTeam: 'Alpha' })
    expect(json).toHaveBeenCalledWith({ text: 'A report', model: 'deepseek-chat' })
  })
})
