import { User, SiteUser } from '@quizleague/shared'
import { v4 as uuid } from 'uuid'
import { docRefById, entityPath, list, save } from '../storage/Storage'
import { HttpError } from './util'
import { teamForUser } from './TeamMembership'

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
