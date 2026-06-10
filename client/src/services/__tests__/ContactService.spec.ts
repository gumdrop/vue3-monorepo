import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useContact } from '../ContactService'

const mocks = vi.hoisted(() => ({
  axiosGet: vi.fn(),
  axiosPost: vi.fn(),
}))

vi.mock('axios', () => ({
  default: {
    get: mocks.axiosGet,
    post: mocks.axiosPost,
  },
}))

describe('ContactService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.axiosGet.mockResolvedValue({
      data: { question: 'What is 2 + 3?', token: 'captcha-token' },
    })
    mocks.axiosPost.mockResolvedValue({})
  })

  it('retrieves contact captcha challenges from the site endpoint', async () => {
    await expect(useContact().contactCaptchaChallenge()).resolves.toEqual({
      question: 'What is 2 + 3?',
      token: 'captcha-token',
    })
    expect(mocks.axiosGet).toHaveBeenCalledWith('/rest/site/contact/captcha')
  })

  it('posts alias email commands to the site endpoint', () => {
    useContact().sendEmailToAlias('sender@example.com', 'Hello', 'secretary', {
      token: 'captcha-token',
      answer: '5',
    })

    expect(mocks.axiosPost).toHaveBeenCalledWith(
      '/rest/site/email/alias',
      {
        sender: 'sender@example.com',
        text: 'Hello',
        alias: 'secretary',
        captcha: { token: 'captcha-token', answer: '5' },
      },
      { headers: { 'Content-type': 'application/json' } },
    )
  })

  it('posts team email commands to the site endpoint', () => {
    useContact().sendEmailToTeam('sender@example.com', 'Hello', 'team-1', {
      token: 'captcha-token',
      answer: '5',
    })

    expect(mocks.axiosPost).toHaveBeenCalledWith(
      '/rest/site/email/team',
      {
        sender: 'sender@example.com',
        text: 'Hello',
        teamId: 'team-1',
        captcha: { token: 'captcha-token', answer: '5' },
      },
      { headers: { 'Content-type': 'application/json' } },
    )
  })
})
