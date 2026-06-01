/* eslint-disable @typescript-eslint/no-explicit-any */
import type Entity from '@/entity/Entity'
import type { DocumentData } from 'firebase/firestore'
import DataConverter from './DataConverter'
import { factorForLegacyCompetition } from '@quizleague/shared'

const isDocumentReference = (value: unknown): value is { path: string; withConverter: unknown } =>
  value !== null && typeof value === 'object' && 'path' in value && 'withConverter' in value

export class GenericConverter<T extends Entity> extends DataConverter<T> {
  buildObject(data: DocumentData, path: string): T {
    const convert = (object: any) => {
      if (isDocumentReference(object)) {
        return object
      }
      if (this.referencePath(object)) {
        return this.makeDocumentRef(object, this)
      }

      const copy = factorForLegacyCompetition({ ...object })

      for (const [key, val] of Object.entries(copy)) {
        const value = val as object
        if (value) {
          if (isDocumentReference(value)) {
            copy[key] = value
          } else if (this.referencePath(value)) {
            copy[key] = this.makeDocumentRef(value, this)
          } else if (Array.isArray(value)) {
            copy[key] = [...value].map((item) => convert(item))
          } else if (typeof value == 'object') {
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
