/* eslint-disable @typescript-eslint/no-explicit-any */
import type Entity from '@/entity/Entity'
import {
  doc,
  DocumentReference,
  type DocumentData,
  type FirestoreDataConverter,
  type QueryDocumentSnapshot,
  type SnapshotOptions,
} from 'firebase/firestore'
import { useFirestore } from 'vuefire'
import {
  isLegacyRef,
  toPath,
  type DocRef,
  type LegacyRef,
  type PathAndId,
  type Pathish,
} from '@quizleague/shared'

const isDocumentReference = (value: unknown): value is DocumentReference =>
  value !== null && typeof value === 'object' && 'path' in value && 'withConverter' in value

const isPathAndIdReference = <U extends Entity>(value: unknown): value is PathAndId<U> => {
  if (value === null || typeof value !== 'object') return false

  const candidate = value as Partial<PathAndId<U>>
  const keys = Object.keys(value)
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.path === 'string' &&
    keys.every((key) => key === 'id' || key === 'path')
  )
}

const isDocRefReference = <U extends Entity>(value: unknown): value is DocRef => {
  if (value === null || typeof value !== 'object') return false

  const candidate = value as Partial<DocRef>
  const keys = Object.keys(value)
  return (
    candidate.type === 'document' &&
    typeof candidate.path === 'string' &&
    keys.every((key) => key === 'type' || key === 'path')
  )
}

const isReference = <U extends Entity>(value: unknown): value is Pathish<U> =>
  isLegacyRef(value) || isPathAndIdReference<U>(value) || isDocRefReference<U>(value)

const normalizeDocumentPath = (path: string) => {
  const normalized = path.replace(/^\/+|\/+$/g, '')
  const segments = normalized.split('/').filter(Boolean)
  return segments.length > 0 && segments.length % 2 === 0 ? normalized : undefined
}

abstract class DataConverter<T extends Entity> implements FirestoreDataConverter<T, DocumentData> {
  db = () => useFirestore()

  toFirestore(
    modelObject: T,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    options?: unknown,
  ):
    | import('@firebase/firestore').WithFieldValue<DocumentData>
    | import('@firebase/firestore').PartialWithFieldValue<DocumentData> {
    const data: any = {}
    for (const [key, value] of Object.entries(modelObject)) {
      const converted = this.toFirestoreValue(value)
      if (converted !== undefined) {
        data[key] = converted
      }
    }
    delete data.key
    delete data.path
    return data as DocumentData
  }

  makeDocumentRef<U extends Entity>(value: any, converter: DataConverter<U>) {
    if (!value) return null

    if (isDocumentReference(value)) {
      return value.withConverter(converter)
    }

    const path = this.referencePath(value)
    return path ? doc(this.db(), path).withConverter(converter) : null
  }

  protected toFirestoreValue(value: any): any {
    if (value === null || value === undefined) return value
    if (isDocumentReference(value)) return value

    const referencePath = this.referencePath(value)
    if (referencePath) {
      return doc(this.db(), referencePath)
    }
    if (isReference(value)) return undefined

    if (Array.isArray(value)) {
      return value.map((item) => this.toFirestoreValue(item)).filter((item) => item !== undefined)
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
      const converted = this.toFirestoreValue(childValue)
      if (converted !== undefined) {
        copy[key] = converted
      }
    }
    return copy
  }

  protected referencePath<U extends Entity>(value: unknown) {
    if (!isReference<U>(value)) return undefined

    if (isLegacyRef(value)) {
      const legacyRef = value as LegacyRef
      const key = legacyRef.key
      const parentKey: string | undefined =
        key !== undefined && key !== null ? key.parentKey : undefined
      const parent = parentKey ? `${parentKey}/` : ''

      return normalizeDocumentPath(`${parent}${legacyRef.typeName}/${legacyRef.id}`)
    }

    return normalizeDocumentPath(toPath(value))
  }

  abstract buildObject(data: DocumentData, key: string): T

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  fromFirestore(snapshot: QueryDocumentSnapshot<DocumentData>, options?: SnapshotOptions) {
    return { ...this.buildObject(snapshot.data(), snapshot.ref.path), path: snapshot.ref.path }
  }
}

export default DataConverter
