import type Entity from '@/entity/Entity'
import { getDoc, type DocumentReference } from 'firebase/firestore'
import { customRef } from 'vue'

export function useDocumentListRef<T extends Entity>(value: Promise<DocumentReference<T>[]>) {
  let refs: T[] = []

  return customRef<T[]>((track, trigger) => {
    async function map(newVal: Promise<DocumentReference<T>[]>) {
      const documents = await newVal
      const entities: T[] = []
      for (const documentRef of documents) {
        const entity = (await getDoc(documentRef)).data() as T | undefined
        if (entity) {
          entities.push(entity)
        }
      }
      refs = entities
      trigger()
    }

    map(value)

    return {
      get() {
        track()
        return refs
      },
      set(newValue: T[]) {
        refs = newValue
        trigger()
      },
    }
  })
}
