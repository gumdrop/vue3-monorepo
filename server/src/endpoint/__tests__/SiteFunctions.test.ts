import sendGridMail from '@sendgrid/mail'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  contactCaptchaChallenge,
  contactPerson,
  contactTeam,
  siteUserForEmail,
} from '../SiteFunctions'
import { list, load, save } from '../../storage/Storage'

vi.mock('@sendgrid/mail', () => ({
  default: {
    send: vi.fn().mockResolvedValue([{}, {}]),
    setApiKey: vi.fn(),
  },
}))

vi.mock('uuid', () => ({
  v4: vi.fn(() => 'site-user-new'),
}))

vi.mock('../../storage/Storage', () => ({
  docRefById: vi.fn((type: string, id: string) => ({ id, path: `${type}/${id}` })),
  entityPath: vi.fn((type: string, id: string) => `${type}/${id}`),
  list: vi.fn(),
  load: vi.fn(),
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

const contactContext = {
  id: 'application-context',
  path: 'applicationcontext/5659313586569216',
  leagueName: 'Chiltern Quiz League',
  senderEmail: 'webmaster@example.com',
  emailAliases: [
    { alias: 'secretary', user: { id: 'user-1', path: 'user/user-1' } },
    { alias: 'secretary', user: { id: 'user-2', path: 'user/user-2' } },
    { alias: 'chair', user: { id: 'user-3', path: 'user/user-3' } },
  ],
}

const previousSendgridApiKey = process.env['SENDGRID_API_KEY']

function pathOf(pathish: unknown) {
  return typeof pathish === 'string' ? pathish : (pathish as { path: string }).path
}

function mockContactLoads() {
  vi.mocked(load).mockImplementation(async (pathish) => {
    const path = pathOf(pathish)

    if (path === 'applicationcontext/5659313586569216') {
      return contactContext as never
    }

    if (path === 'team/team-1') {
      return team as never
    }

    if (path === 'user/user-1') {
      return user as never
    }

    if (path === 'user/user-2') {
      return {
        id: 'user-2',
        path: 'user/user-2',
        email: 'captain@example.com',
      } as never
    }

    if (path === 'user/user-3') {
      return {
        id: 'user-3',
        path: 'user/user-3',
        email: '',
      } as never
    }

    throw new Error(`Unexpected load for ${path}`)
  })
}

function solvedCaptcha() {
  const challenge = contactCaptchaChallenge()
  const [, left, right] = challenge.question.match(/^What is (\d+) \+ (\d+)\?$/) ?? []

  return {
    token: challenge.token,
    answer: String(Number(left) + Number(right)),
  }
}

function decodedCaptchaPayload() {
  const challenge = contactCaptchaChallenge()
  const [payload] = challenge.token.split('.')
  return JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as Record<string, unknown>
}

describe('SiteFunctions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env['SENDGRID_API_KEY'] = 'sendgrid-key'
  })

  afterEach(() => {
    if (previousSendgridApiKey === undefined) {
      delete process.env['SENDGRID_API_KEY']
    } else {
      process.env['SENDGRID_API_KEY'] = previousSendgridApiKey
    }
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

  it('sends team email to users in the member document', async () => {
    mockContactLoads()
    vi.mocked(list).mockImplementation(async (type) => {
      if (type === 'member') {
        return [
          {
            id: 'members',
            path: 'team/team-1/member/members',
            users: [
              { id: 'user-1', path: 'user/user-1' },
              { id: 'user-2', path: 'user/user-2' },
              { id: 'user-3', path: 'user/user-3' },
            ],
          },
        ] as never
      }
      return [] as never
    })

    await expect(
      contactTeam({
        sender: 'sender@example.com',
        text: 'Hello <team>\nPlease reply.',
        teamId: 'team-1',
        captcha: solvedCaptcha(),
      }),
    ).resolves.toEqual([])

    expect(load).toHaveBeenCalledWith('team/team-1')
    expect(list).toHaveBeenCalledWith('member', team)
    expect(sendGridMail.setApiKey).toHaveBeenCalledWith('sendgrid-key')
    expect(sendGridMail.send).toHaveBeenCalledWith({
      to: ['Player@example.com', 'captain@example.com'],
      from: 'webmaster@example.com',
      replyTo: 'sender@example.com',
      subject: 'Sent via Chiltern Quiz League : From sender@example.com ',
      text: 'Hello <team>\nPlease reply.',
      html: '<p>Hello &lt;team&gt;<br>Please reply.</p>',
    })
  })

  it('does not use legacy team users when no member document exists', async () => {
    const teamWithLegacyUsers = {
      ...team,
      users: [{ id: 'user-1', path: 'user/user-1' }],
    }
    vi.mocked(load).mockImplementation(async (pathish) => {
      const path = pathOf(pathish)
      if (path === 'applicationcontext/5659313586569216') return contactContext as never
      if (path === 'team/team-1') return teamWithLegacyUsers as never
      throw new Error(`Unexpected load for ${path}`)
    })
    vi.mocked(list).mockResolvedValue([] as never)

    await expect(
      contactTeam({
        sender: 'sender@example.com',
        text: 'Hello',
        teamId: 'team-1',
        captcha: solvedCaptcha(),
      }),
    ).resolves.toEqual([])

    expect(sendGridMail.send).not.toHaveBeenCalled()
  })

  it('sends alias email to each matching alias user', async () => {
    mockContactLoads()

    await expect(
      contactPerson({
        sender: 'sender@example.com',
        text: 'Hello alias',
        alias: 'secretary',
        captcha: solvedCaptcha(),
      }),
    ).resolves.toEqual([])

    expect(load).toHaveBeenCalledWith({ id: 'user-1', path: 'user/user-1' })
    expect(load).toHaveBeenCalledWith({ id: 'user-2', path: 'user/user-2' })
    expect(load).not.toHaveBeenCalledWith({ id: 'user-3', path: 'user/user-3' })
    expect(sendGridMail.send).toHaveBeenCalledWith({
      to: ['Player@example.com', 'captain@example.com'],
      from: 'webmaster@example.com',
      replyTo: 'sender@example.com',
      subject: 'Sent via Chiltern Quiz League : From sender@example.com ',
      text: 'Hello alias',
      html: '<p>Hello alias</p>',
    })
  })

  it('returns without sending when an alias is not configured', async () => {
    mockContactLoads()
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)

    await expect(
      contactPerson({
        sender: 'sender@example.com',
        text: 'Hello alias',
        alias: 'missing',
        captcha: solvedCaptcha(),
      }),
    ).resolves.toEqual([])

    expect(errorSpy).toHaveBeenCalledWith("No alias found for 'missing'")
    expect(sendGridMail.send).not.toHaveBeenCalled()
  })

  it('throws when SendGrid is not configured for a message with recipients', async () => {
    delete process.env['SENDGRID_API_KEY']
    mockContactLoads()
    vi.mocked(list).mockImplementation(async (type) => {
      if (type === 'member') return [teamMember] as never
      return [] as never
    })

    await expect(
      contactTeam({
        sender: 'sender@example.com',
        text: 'Hello',
        teamId: 'team-1',
        captcha: solvedCaptcha(),
      }),
    ).rejects.toMatchObject({
      statusCode: 500,
      statusMessage: 'Internal server error',
    })
  })

  it('creates contact captcha challenges that can be solved by the submitted answer', async () => {
    const captcha = solvedCaptcha()
    mockContactLoads()

    await expect(
      contactPerson({
        sender: 'sender@example.com',
        text: 'Hello alias',
        alias: 'secretary',
        captcha,
      }),
    ).resolves.toEqual([])
    expect(sendGridMail.send).toHaveBeenCalled()
  })

  it('does not expose the contact captcha answer in the client token', () => {
    const payload = decodedCaptchaPayload()

    expect(payload).toHaveProperty('answerHash')
    expect(payload).toHaveProperty('expiresAt')
    expect(payload).toHaveProperty('nonce')
    expect(payload).not.toHaveProperty('answer')
  })

  it('rejects contact email when captcha verification fails', async () => {
    mockContactLoads()

    await expect(
      contactPerson({
        sender: 'sender@example.com',
        text: 'Hello alias',
        alias: 'secretary',
        captcha: { token: 'bad-token', answer: '5' },
      }),
    ).rejects.toMatchObject({
      statusCode: 400,
      statusMessage: 'Bad Request',
    })

    expect(sendGridMail.send).not.toHaveBeenCalled()
  })

  it('rejects contact email when the captcha answer is wrong', async () => {
    mockContactLoads()

    await expect(
      contactPerson({
        sender: 'sender@example.com',
        text: 'Hello alias',
        alias: 'secretary',
        captcha: { ...solvedCaptcha(), answer: '999' },
      }),
    ).rejects.toMatchObject({
      statusCode: 400,
      statusMessage: 'Bad Request',
    })

    expect(sendGridMail.send).not.toHaveBeenCalled()
  })
})
