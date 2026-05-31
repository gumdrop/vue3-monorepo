import type { Request, Response } from 'express'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { SINGLETON_ID } from '@quizleague/shared'
import { applicationContext, currentSeason, param, send, sendText } from '../util'
import { entityPath, load } from '../../storage/Storage'

vi.mock('../../storage/Storage', () => ({
  entityPath: vi.fn((type: string, id: string) => `${type}/${id}`),
  load: vi.fn(),
}))

const flushPromises = () => new Promise((resolve) => setTimeout(resolve, 0))

const response = () =>
  ({
    json: vi.fn(),
    send: vi.fn(),
    status: vi.fn().mockReturnThis(),
    statusMessage: '',
  }) as unknown as Response

describe('endpoint util', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'log').mockImplementation(() => undefined)
  })

  it('sends resolved JSON values', async () => {
    const res = response()

    send(Promise.resolve({ ok: true }), res)
    await flushPromises()

    expect(res.json).toHaveBeenCalledWith({ ok: true })
  })

  it('sends rejected JSON results as internal server errors', async () => {
    const res = response()

    send(Promise.reject(new Error('broken')), res)
    await flushPromises()

    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.statusMessage).toBe('Internal server error')
    expect(res.send).toHaveBeenCalledWith('broken')
  })

  it('sends resolved text values', async () => {
    const res = response()

    sendText('plain text', res)
    await flushPromises()

    expect(res.send).toHaveBeenCalledWith('plain text')
  })

  it('sends rejected text results as internal server errors', async () => {
    const res = response()

    sendText(Promise.reject(new Error('text failed')), res)
    await flushPromises()

    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.statusMessage).toBe('Internal server error')
    expect(res.send).toHaveBeenCalledWith('text failed')
  })

  it('reads route parameters by name', () => {
    const req = { params: { teamId: 'team-1' } } as unknown as Request

    expect(param('teamId', req)).toBe('team-1')
    expect(console.log).toHaveBeenCalledWith('params : {"teamId":"team-1"}')
  })

  it('loads the singleton application context', async () => {
    const context = {
      id: SINGLETON_ID,
      path: `applicationcontext/${SINGLETON_ID}`,
      currentSeason: { id: 'season-1', path: 'season/season-1' },
    }
    vi.mocked(load).mockResolvedValue(context as never)

    await expect(applicationContext()).resolves.toBe(context)

    expect(entityPath).toHaveBeenCalledWith('applicationcontext', SINGLETON_ID)
    expect(load).toHaveBeenCalledWith(`applicationcontext/${SINGLETON_ID}`)
  })

  it('loads the season referenced by the application context', async () => {
    const context = {
      id: SINGLETON_ID,
      path: `applicationcontext/${SINGLETON_ID}`,
      currentSeason: { id: 'season-1', path: 'season/season-1' },
    }
    const season = { id: 'season-1', path: 'season/season-1' }
    vi.mocked(load).mockImplementation(async (pathish) => {
      const path = typeof pathish === 'string' ? pathish : 'path' in pathish ? pathish.path : ''
      return (path === context.path ? context : season) as never
    })

    await expect(currentSeason()).resolves.toBe(season)

    expect(load).toHaveBeenCalledWith(`applicationcontext/${SINGLETON_ID}`)
    expect(load).toHaveBeenCalledWith(context.currentSeason)
  })
})
