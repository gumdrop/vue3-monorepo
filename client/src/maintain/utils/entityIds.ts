import { v4 as uuid } from 'uuid'

export type EntityIdentity = {
  id: string
  path: string
}

export const newEntityId = () => uuid()

export const newEntityIdentity = (collectionPath: string): EntityIdentity => {
  const id = newEntityId()
  const basePath = collectionPath.replace(/\/$/, '')

  return {
    id,
    path: `${basePath}/${id}`,
  }
}
