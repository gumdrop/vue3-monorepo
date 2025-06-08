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

abstract class DataConverter<T extends Entity> implements FirestoreDataConverter<T, DocumentData> {
  db = () => useFirestore()

  toFirestore(
    modelObject: T,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    options?: unknown,
  ):
    | import('@firebase/firestore').WithFieldValue<DocumentData>
    | import('@firebase/firestore').PartialWithFieldValue<DocumentData> {
    const data: any = { ...modelObject }
    delete data.key
    delete data.path
    return data as DocumentData
  }

  makeDocumentRef<U extends Entity>(value: any, converter: DataConverter<U>) {
    if (!value) return null
    const pathFromRef = (ref: any) => {
      const key = ref.key
      const parentKey: string | undefined =
        key !== undefined && key !== null ? key.parentKey : undefined
      const parent = parentKey ? `${parentKey}/` : ''

      return `${parent}${ref.typeName}/${ref.id}`
    }

    return "id" in value && "typeName" in value
      ? (doc(this.db(), pathFromRef(value)).withConverter(
          converter,
        ) as unknown as DocumentReference<U>)
      : (value as DocumentReference).withConverter(converter)
  }

  abstract buildObject(data: DocumentData, key: string): T

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  fromFirestore(snapshot: QueryDocumentSnapshot<DocumentData>, options?: SnapshotOptions) {
    return { ...this.buildObject(snapshot.data(), snapshot.ref.path), path: snapshot.ref.path }
  }
}

export default DataConverter
