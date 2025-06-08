/* eslint-disable @typescript-eslint/no-explicit-any */
import type Entity from '@/entity/Entity'
import type { DocumentData } from 'firebase/firestore'
import DataConverter from './DataConverter'
import { factorForLegacyCompetition, isLegacyRef } from '@quizleague/shared'

export class GenericConverter<T extends Entity> extends DataConverter<T> {
  buildObject(data: DocumentData, path: string): T {
    const convert = (object: any) => {
      const copy = factorForLegacyCompetition({ ...object })

      for (const [key, val] of Object.entries(copy)) {
        const value = val as object
        if (value) {
          if (isLegacyRef(value)) {
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

    return { ...convert(data), path } as T
  }
}
