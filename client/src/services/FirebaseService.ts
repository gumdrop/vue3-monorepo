import type Entity from '@/entity/Entity'
import { getDoc, type DocumentReference } from 'firebase/firestore'

export async function docData<T extends Entity>(docRef: DocumentReference<T> | undefined) {
  return docRef ? (await getDoc(docRef)).data() : undefined
}
