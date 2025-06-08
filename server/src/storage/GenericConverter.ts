/* eslint-disable @typescript-eslint/no-explicit-any */
import { DocumentReference, FirestoreDataConverter } from '@google-cloud/firestore'
import { Entity, factorForLegacyCompetition, isLegacyRef } from '@quizleague/shared'
import type { DocumentData } from 'firebase/firestore'

import { db } from './Storage'

export class GenericConverter<T extends Entity> implements FirestoreDataConverter<T, DocumentData> {
  toFirestore(modelObject: T) {
    const copy: any = { ...modelObject }
    delete copy.path
    delete copy.key

    return copy as DocumentData
  }

  fromFirestore(snapshot: FirebaseFirestore.QueryDocumentSnapshot): T {
    const data = snapshot.data()
    const path = snapshot.ref.path

    const convert = (object: any) => {
      const copy = factorForLegacyCompetition({ ...object })

      for (const [key, val] of Object.entries(object)) {
        const value = val as object
        if (value) {
          if (isLegacyRef(value)) {
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

    return { ...convert(data), path } as T
  }
}

function makeDocumentRef<U extends Entity>(value: any, converter: GenericConverter<U>) {
  if (!value) return null
  const pathFromRef = (ref: any) => {
    const key = ref.key
    const parentKey: string | undefined =
      key !== undefined && key !== null ? key.parentKey : undefined
    const parent = parentKey ? `${parentKey}/` : ''

    return `${parent}${ref.typeName}/${ref.id}`
  }

  return 'id' in value && 'typeName' in value
    ? (db().doc(pathFromRef(value)).withConverter(converter) as unknown as DocumentReference<U>)
    : (value as DocumentReference).withConverter(converter)
}
