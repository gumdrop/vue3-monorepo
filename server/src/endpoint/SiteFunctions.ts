import sendGridMail from '@sendgrid/mail'
import { createHmac, randomBytes, randomInt, timingSafeEqual } from 'node:crypto'
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
  captcha: ContactCaptchaResponse
}

export interface AliasEmailCommand {
  sender: string
  text: string
  alias: string
  captcha: ContactCaptchaResponse
}

export interface ContactCaptchaChallenge {
  question: string
  token: string
}

export interface ContactCaptchaResponse {
  token: string
  answer: string
}

interface ContactCaptchaPayload {
  answerHash: string
  expiresAt: number
  nonce: string
}

const captchaLifetimeMs = 10 * 60 * 1000
const fallbackCaptchaSecret = randomBytes(32).toString('base64url')

function sendGridApiKey() {
  const apiKey = process.env['SENDGRID_API_KEY']?.trim()
  if (!apiKey) {
    throw new HttpError(500, 'SENDGRID_API_KEY is not configured', 'Internal server error')
  }
  return apiKey
}

function contactCaptchaSecret() {
  return process.env['CONTACT_CAPTCHA_SECRET']?.trim() || fallbackCaptchaSecret
}

function signCaptchaPayload(payload: string) {
  return createHmac('sha256', contactCaptchaSecret()).update(payload).digest('base64url')
}

function captchaAnswerHash(nonce: string, answer: string) {
  return createHmac('sha256', contactCaptchaSecret())
    .update(`${nonce}:${answer.trim()}`)
    .digest('base64url')
}

function encodeCaptchaPayload(payload: ContactCaptchaPayload) {
  return Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url')
}

function decodeCaptchaPayload(payload: string) {
  return JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as ContactCaptchaPayload
}

function signaturesMatch(actual: string, expected: string) {
  const actualBuffer = Buffer.from(actual)
  const expectedBuffer = Buffer.from(expected)
  return actualBuffer.length === expectedBuffer.length && timingSafeEqual(actualBuffer, expectedBuffer)
}

function captchaError() {
  return new HttpError(400, 'Captcha verification failed', 'Bad Request')
}

function teamPath(teamId: string) {
  return teamId.includes('/') ? teamId : entityPath('team', teamId)
}

function uniqueEmails(users: User[]) {
  return [
    ...new Set(
      users.map((user) => user.email?.trim()).filter((email): email is string => Boolean(email)),
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
  const response = await sendGridMail.send({
    to: addresses,
    from: context.senderEmail,
    replyTo: sender,
    subject: subject || `Sent via ${context.leagueName} : From ${sender} `,
    text,
    html: htmlBody(text),
  })
  console.log(`Sent email to ${addresses.join(', ')} with status ${JSON.stringify(response[0])}`)
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
  }

  throw new HttpError(404, 'no user found for email', 'Not Found')
}

export function contactCaptchaChallenge(): ContactCaptchaChallenge {
  const left = randomInt(2, 10)
  const right = randomInt(2, 10)
  const answer = String(left + right)
  const nonce = randomBytes(16).toString('base64url')
  const payload = encodeCaptchaPayload({
    answerHash: captchaAnswerHash(nonce, answer),
    expiresAt: Date.now() + captchaLifetimeMs,
    nonce,
  })

  return {
    question: `What is ${left} + ${right}?`,
    token: `${payload}.${signCaptchaPayload(payload)}`,
  }
}

export function verifyContactCaptcha(captcha: ContactCaptchaResponse | undefined) {
  if (!captcha?.token || !captcha.answer) throw captchaError()

  const [payload, signature, ...extraParts] = captcha.token.split('.')
  if (!payload || !signature || extraParts.length > 0) throw captchaError()
  if (!signaturesMatch(signature, signCaptchaPayload(payload))) throw captchaError()

  try {
    const challenge = decodeCaptchaPayload(payload)
    if (challenge.expiresAt < Date.now()) throw captchaError()
    if (!signaturesMatch(challenge.answerHash, captchaAnswerHash(challenge.nonce, captcha.answer))) {
      throw captchaError()
    }
  } catch (error) {
    if (error instanceof HttpError) throw error
    throw captchaError()
  }
}

export async function contactTeam(mail: TeamEmailCommand) {
  verifyContactCaptcha(mail.captcha)

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
  verifyContactCaptcha(mail.captcha)

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
