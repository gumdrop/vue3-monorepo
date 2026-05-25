/* eslint-disable @typescript-eslint/no-explicit-any */
import { DocumentReference, FirestoreDataConverter } from '@google-cloud/firestore'
import {
  Entity,
  factorForLegacyCompetition,
  isLegacyRef,
  toPath,
  type DocRef,
  type LegacyRef,
  type PathAndId,
  type Pathish,
} from '@quizleague/shared'
import type { DocumentData } from 'firebase/firestore'

import { db } from './Storage'

export class GenericConverter<T extends Entity> implements FirestoreDataConverter<T, DocumentData> {
  toFirestore(modelObject: T) {
    const copy: any = {}
    for (const [key, value] of Object.entries(modelObject)) {
      copy[key] = toFirestoreValue(value)
    }
    delete copy.path
    delete copy.key

    return copy as DocumentData
  }

  fromFirestore(snapshot: FirebaseFirestore.QueryDocumentSnapshot): T {
    const data = snapshot.data()
    const path = snapshot.ref.path

    const convert = (object: any) => {
      if (isDocumentReference(object)) {
        return object
      }
      if (referencePath(object)) {
        return makeDocumentRef(object, this)
      }

      const copy = factorForLegacyCompetition({ ...object })

      for (const [key, val] of Object.entries(object)) {
        const value = val as object
        if (value) {
          if (isDocumentReference(value)) {
            copy[key] = value
          } else if (referencePath(value)) {
            copy[key] = makeDocumentRef(value, this)
          } else if (Array.isArray(value)) {
            copy[key] = [...value].map((item) => convert(item))
          } else if (typeof value === 'object') {
            copy[key] = convert(value)
          }
        }
      }

      return copy
    }

    const id = path.substring(path.lastIndexOf('/') + 1)
    return { ...convert(data), path, id } as T
  }
}

function isDocumentReference(value: unknown): value is DocumentReference {
  return value !== null && typeof value === 'object' && 'path' in value && 'withConverter' in value
}

function isPathAndIdReference<U extends Entity>(value: unknown): value is PathAndId<U> {
  if (value === null || typeof value !== 'object') return false

  const candidate = value as Partial<PathAndId<U>>
  const keys = Object.keys(value)
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.path === 'string' &&
    keys.every((key) => key === 'id' || key === 'path')
  )
}

function isDocRefReference(value: unknown): value is DocRef {
  if (value === null || typeof value !== 'object') return false

  const candidate = value as Partial<DocRef>
  const keys = Object.keys(value)
  return (
    candidate.type === 'document' &&
    typeof candidate.path === 'string' &&
    keys.every((key) => key === 'type' || key === 'path')
  )
}

function isReference<U extends Entity>(value: unknown): value is Pathish<U> {
  return isLegacyRef(value) || isPathAndIdReference<U>(value) || isDocRefReference(value)
}

function referencePath<U extends Entity>(value: unknown) {
  if (!isReference<U>(value)) return undefined

  if (isLegacyRef(value)) {
    const legacyRef = value as LegacyRef
    const key = legacyRef.key
    const parentKey: string | undefined =
      key !== undefined && key !== null ? key.parentKey : undefined
    const parent = parentKey ? `${parentKey}/` : ''

    return `${parent}${legacyRef.typeName}/${legacyRef.id}`
  }

  return toPath(value)
}

function toFirestoreValue(value: any): any {
  if (value === null || value === undefined) return value
  if (isDocumentReference(value)) return value

  const path = referencePath(value)
  if (path) {
    return db().doc(path)
  }

  if (Array.isArray(value)) {
    return value.map((item) => toFirestoreValue(item)).filter((item) => item !== undefined)
  }

  if (typeof value === 'function') return undefined
  if (typeof value !== 'object') return value
  if (value instanceof Date) return value

  const entries = Object.entries(value)
  if (entries.length > 0 && entries.every(([, item]) => typeof item === 'function')) {
    return undefined
  }

  const copy: any = {}
  for (const [key, childValue] of entries) {
    const converted = toFirestoreValue(childValue)
    if (converted !== undefined) {
      copy[key] = converted
    }
  }
  return copy
}

function makeDocumentRef<U extends Entity>(value: any, converter: GenericConverter<U>) {
  if (!value) return null

  if (isDocumentReference(value)) {
    return value.withConverter(converter)
  }

  const path = referencePath(value)
  return path ? (db().doc(path).withConverter(converter) as unknown as DocumentReference<U>) : null
}
