import sendGridMail from '@sendgrid/mail'
import {
  ApplicationContext,
  SiteUser,
  Team,
  TeamMember,
  User,
  type Pathish,
} from '@quizleague/shared'
import { v4 as uuid } from 'uuid'
import { docRefById, entityPath, list, load, save } from '../storage/Storage'
import { applicationContext, HttpError } from './util'
import { teamForUser } from './TeamMembership'

export interface TeamEmailCommand {
  sender: string
  text: string
  teamId: string
}

export interface AliasEmailCommand {
  sender: string
  text: string
  alias: string
}

function sendGridApiKey() {
  const apiKey = process.env['SENDGRID_API_KEY']?.trim()
  if (!apiKey) {
    throw new HttpError(500, 'SENDGRID_API_KEY is not configured', 'Internal server error')
  }
  return apiKey
}

function teamPath(teamId: string) {
  return teamId.includes('/') ? teamId : entityPath('team', teamId)
}

function uniqueEmails(users: User[]) {
  return [
    ...new Set(
      users
        .map((user) => user.email?.trim())
        .filter((email): email is string => Boolean(email)),
    ),
  ]
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function htmlBody(text: string) {
  return `<p>${escapeHtml(text).replace(/\r?\n/g, '<br>')}</p>`
}

async function sendMail(
  sender: string,
  text: string,
  context: ApplicationContext,
  addresses: string[],
  subject = '',
) {
  if (addresses.length === 0) return

  sendGridMail.setApiKey(sendGridApiKey())
  await sendGridMail.send({
    to: addresses,
    from: context.senderEmail,
    replyTo: sender,
    subject: subject || `Sent via ${context.leagueName} : From ${sender} `,
    text,
    html: htmlBody(text),
  })
}

async function usersForRefs(refs: Pathish<User>[]) {
  return Promise.all(refs.map((ref) => load<User>(ref)))
}

function serializableSiteUser(siteUser: SiteUser): SiteUser {
  return {
    ...siteUser,
    user: siteUser.user
      ? {
          id: siteUser.user.id,
          path: siteUser.user.path,
        }
      : undefined,
  }
}

export async function siteUserForEmail(email: string) {
  async function createAndSave(user: User) {
    const id = uuid()
    const siteUser: SiteUser = {
      id,
      avatar: '',
      handle: '',
      user: docRefById('user', user.id),
      path: entityPath('siteuser', id),
    }
    await save(siteUser)
    return serializableSiteUser(siteUser)
  }

  const lce = email.toLowerCase()
  const users = await list<User>('user')
  const user = users.find((u) => u?.email?.toLowerCase() === lce)

  const siteUsers = await list<SiteUser>('siteuser')

  if (user) {
    const userHasTeam = await teamForUser(user)
    if (userHasTeam) {
      const siteUser = siteUsers.find((su) => su.user && su.user.id === user.id)
      if (siteUser) {
        return serializableSiteUser(siteUser)
      } else {
        return createAndSave(user)
      }
    }
  } else {
    throw new HttpError(404, 'no user found for email', 'Not Found')
  }
}

export async function contactTeam(mail: TeamEmailCommand) {
  const [context, team] = await Promise.all([
    applicationContext(),
    load<Team>(teamPath(mail.teamId)),
  ])
  const teamMember = (await list<TeamMember>('member', team))[0]
  const users = await usersForRefs(teamMember?.users ?? [])

  await sendMail(mail.sender, mail.text, context, uniqueEmails(users))
  return [] as string[]
}

export async function contactPerson(mail: AliasEmailCommand) {
  const context = await applicationContext()
  const aliases = context.emailAliases.filter((emailAlias) => emailAlias.alias === mail.alias)

  if (aliases.length === 0) {
    console.error(`No alias found for '${mail.alias}'`)
    return [] as string[]
  }

  const users = await usersForRefs(aliases.map((emailAlias) => emailAlias.user))
  await sendMail(mail.sender, mail.text, context, uniqueEmails(users))
  return [] as string[]
}
