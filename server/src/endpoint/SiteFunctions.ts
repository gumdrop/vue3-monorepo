import { User,SiteUser, Team } from '@quizleague/shared'
import { v4 as uuid } from 'uuid'
import { docRefById, entityPath, list, save } from '../storage/Storage'

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
    return siteUser
  }

  const lce = email.toLowerCase()
  const users = await list<User>('user')
  const user = users.find((u) => u?.email?.toLowerCase() === lce)

  const hasTeam = async (user: User) => {
    return (await list<Team>('team')).find((t) => t.users.find((u) => u.id === user.id))
  }

  const siteUsers = await list<SiteUser>('siteuser')

  if (user) {
    const userHasTeam = await hasTeam(user)
    if (userHasTeam) {
      const siteUser = siteUsers.find((su) => su.user && su.user.id === user.id)
      if (siteUser) {
        return siteUser
      } else {
        return createAndSave(user)
      }
    }
  } else {
    throw new Error('no user found for email')
  }
}
