import User from '@/entity/User'
import DAO from './DAO'
import DataConverter from './DataConverter'
import type { DocumentData } from 'firebase/firestore'
import { v4 as uuid } from 'uuid'

class UserDAO extends DAO<User> {
  constructor() {
    super('user')
  }

  converter = new UserConverter()

  newInstance = () => {
    const id = uuid()
   return new User(id, '', '', `${this.entity}/${id}`)
  }
}

class UserConverter extends DataConverter<User> {
  buildObject(data: DocumentData, key: string): User {
    return new User(data.id, data.name, data.email, key, data.retired)
  }
}

export default new UserDAO()
