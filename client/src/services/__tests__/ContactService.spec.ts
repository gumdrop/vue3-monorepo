import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useContact } from '../ContactService'

const mocks = vi.hoisted(() => ({
  axiosPost: vi.fn(),
}))

vi.mock('axios', () => ({
  default: {
    post: mocks.axiosPost,
  },
}))

describe('ContactService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('posts alias email commands to the site endpoint', () => {
    useContact().sendEmailToAlias('sender@example.com', 'Hello', 'secretary')

    expect(mocks.axiosPost).toHaveBeenCalledWith(
      '/rest/site/email/alias',
      {
        sender: 'sender@example.com',
        text: 'Hello',
        alias: 'secretary',
      },
      { headers: { 'Content-type': 'application/json' } },
    )
  })

  it('posts team email commands to the site endpoint', () => {
    useContact().sendEmailToTeam('sender@example.com', 'Hello', 'team-1')

    expect(mocks.axiosPost).toHaveBeenCalledWith(
      '/rest/site/email/team',
      {
        sender: 'sender@example.com',
        text: 'Hello',
        teamId: 'team-1',
      },
      { headers: { 'Content-type': 'application/json' } },
    )
  })
})
