import type { Application, Request, Response } from 'express'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import configure from '../SiteEndpoints'
import { resultSubmission } from '../TaskFunctions'
import {
  contactCaptchaChallenge,
  contactPerson,
  contactTeam,
  siteUserForEmail,
} from '../SiteFunctions'

vi.mock('../TaskFunctions', () => ({
  resultSubmission: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('../SiteFunctions', () => ({
  contactCaptchaChallenge: vi.fn().mockReturnValue({
    question: 'What is 2 + 3?',
    token: 'captcha-token',
  }),
  contactPerson: vi.fn().mockResolvedValue([]),
  contactTeam: vi.fn().mockResolvedValue([]),
  siteUserForEmail: vi.fn().mockResolvedValue({
    id: 'site-user-1',
    path: 'siteuser/site-user-1',
    user: { id: 'user-1', path: 'user/user-1' },
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

  it('routes site user email lookups to the site function', async () => {
    const { app, routes } = createApp()
    configure(app)

    const response = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis(),
      send: vi.fn(),
    } as unknown as Response

    routes.get('GET /rest/site/site-user-for-email/:email')?.(
      { params: { email: 'PLAYER@example.com' } } as unknown as Request,
      response,
    )
    await flushPromises()

    expect(siteUserForEmail).toHaveBeenCalledWith('PLAYER@example.com')
    expect(response.json).toHaveBeenCalledWith({
      id: 'site-user-1',
      path: 'siteuser/site-user-1',
      user: { id: 'user-1', path: 'user/user-1' },
    })
  })

  it('routes team email requests to the site function', async () => {
    const { app, routes } = createApp()
    configure(app)

    const command = {
      sender: 'sender@example.com',
      text: 'Can someone contact me?',
      teamId: 'team-1',
      captcha: { token: 'captcha-token', answer: '5' },
    }
    const response = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis(),
      send: vi.fn(),
    } as unknown as Response

    routes.get('POST /rest/site/email/team')?.(
      { body: JSON.stringify(command) } as Request,
      response,
    )
    await flushPromises()

    expect(contactTeam).toHaveBeenCalledWith(command)
    expect(response.json).toHaveBeenCalledWith([])
  })

  it('routes alias email requests to the site function', async () => {
    const { app, routes } = createApp()
    configure(app)

    const command = {
      sender: 'sender@example.com',
      text: 'Can someone contact me?',
      alias: 'secretary',
      captcha: { token: 'captcha-token', answer: '5' },
    }
    const response = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis(),
      send: vi.fn(),
    } as unknown as Response

    routes.get('POST /rest/site/email/alias')?.({ body: command } as Request, response)
    await flushPromises()

    expect(contactPerson).toHaveBeenCalledWith(command)
    expect(response.json).toHaveBeenCalledWith([])
  })

  it('routes contact captcha challenge requests to the site function', async () => {
    const { app, routes } = createApp()
    configure(app)

    const response = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis(),
      send: vi.fn(),
    } as unknown as Response

    routes.get('GET /rest/site/contact/captcha')?.({} as Request, response)
    await flushPromises()

    expect(contactCaptchaChallenge).toHaveBeenCalled()
    expect(response.json).toHaveBeenCalledWith({
      question: 'What is 2 + 3?',
      token: 'captcha-token',
    })
  })
})
