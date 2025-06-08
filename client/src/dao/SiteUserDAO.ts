import type SiteUser from '@/entity/SiteUser'
import DAO from './DAO'
import { GenericConverter } from './GenericConverter'
import { query, where } from 'firebase/firestore'

class SiteUserDAO extends DAO<SiteUser> {
  constructor() {
    super('siteuser')
  }

  converter = new GenericConverter<SiteUser>()

  siteUserForUid = async (uid: string) => {
    const userQuery = query(this.collection(), where('uid', '==', uid))

    const siteUsers = await this.entities(userQuery)

    return siteUsers.length ? siteUsers[0] : undefined
  }
}

export default new SiteUserDAO()
