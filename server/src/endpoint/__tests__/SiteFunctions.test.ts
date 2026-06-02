import { beforeEach, describe, expect, it, vi } from 'vitest'
import { siteUserForEmail } from '../SiteFunctions'
import { list, save } from '../../storage/Storage'

vi.mock('uuid', () => ({
  v4: vi.fn(() => 'site-user-new'),
}))

vi.mock('../../storage/Storage', () => ({
  docRefById: vi.fn((type: string, id: string) => ({ id, path: `${type}/${id}` })),
  entityPath: vi.fn((type: string, id: string) => `${type}/${id}`),
  list: vi.fn(),
  save: vi.fn(),
}))

const user = {
  id: 'user-1',
  path: 'user/user-1',
  email: 'Player@example.com',
}

const team = {
  id: 'team-1',
  path: 'team/team-1',
}

const teamMember = {
  id: 'members',
  path: 'team/team-1/member/members',
  users: [{ id: 'user-1', path: 'user/user-1' }],
}

describe('SiteFunctions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns an existing site user for a matching email ignoring case', async () => {
    const siteUser = {
      id: 'site-user-1',
      path: 'siteuser/site-user-1',
      handle: 'captain',
      avatar: 'avatar.png',
      user: {
        id: 'user-1',
        path: 'user/user-1',
        withConverter: vi.fn(),
      },
    }
    vi.mocked(list).mockImplementation(async (type) => {
      if (type === 'user') return [user] as never
      if (type === 'team') return [team] as never
      if (type === 'member') return [teamMember] as never
      if (type === 'siteuser') return [siteUser] as never
      return [] as never
    })

    await expect(siteUserForEmail('player@EXAMPLE.com')).resolves.toEqual({
      id: 'site-user-1',
      path: 'siteuser/site-user-1',
      handle: 'captain',
      avatar: 'avatar.png',
      user: { id: 'user-1', path: 'user/user-1' },
    })
    expect(save).not.toHaveBeenCalled()
  })

  it('creates and saves a site user when the league user has a team but no site user', async () => {
    vi.mocked(list).mockImplementation(async (type) => {
      if (type === 'user') return [user] as never
      if (type === 'team') return [team] as never
      if (type === 'member') return [teamMember] as never
      if (type === 'siteuser') return [] as never
      return [] as never
    })

    await expect(siteUserForEmail('player@example.com')).resolves.toEqual({
      id: 'site-user-new',
      path: 'siteuser/site-user-new',
      avatar: '',
      handle: '',
      user: { id: 'user-1', path: 'user/user-1' },
    })
    expect(save).toHaveBeenCalledWith({
      id: 'site-user-new',
      path: 'siteuser/site-user-new',
      avatar: '',
      handle: '',
      user: { id: 'user-1', path: 'user/user-1' },
    })
  })

  it('throws when no league user matches the email address', async () => {
    vi.mocked(list).mockImplementation(async (type) => {
      if (type === 'user') return [] as never
      if (type === 'siteuser') return [] as never
      return [team] as never
    })

    await expect(siteUserForEmail('missing@example.com')).rejects.toThrow(
      'no user found for email',
    )
    await expect(siteUserForEmail('missing@example.com')).rejects.toMatchObject({
      statusCode: 404,
      statusMessage: 'Not Found',
    })
  })
})
