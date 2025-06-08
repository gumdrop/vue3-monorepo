import type Entity from '@/entity/Entity'
import { DocumentReference } from 'firebase/firestore'
import { customRef } from 'vue'
import { useDocument } from 'vuefire'

export function useDocumentListRef<T extends Entity>(value: Promise<DocumentReference<T>[]>) {
  let refs: T[] = []

  return customRef<T[]>((track, trigger) => {
    function map(newVal: Promise<DocumentReference<T>[]>) {
      refs = []
      newVal.then((t) => {
        t.map((d) => useDocument(d).promise.value.then((e) => refs.push(e)))
        trigger()
      })
    }

    map(value)

    return {
      get() {
        track()
        return refs
      },
      set(newValue: Promise<DocumentReference<T>[]>) {
        map(newValue)
        trigger()
      },
    }
  })
}
