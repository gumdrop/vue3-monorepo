import type Entity from '@/entity/Entity'
import { toPath, type Pathish } from '@quizleague/shared'
import {
  collection,
  CollectionReference,
  doc,
  DocumentReference,
  getDoc,
  getDocs,
  orderBy,
  Query,
  query,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore'
import { useFirestore } from 'vuefire'
import type DataConverter from './DataConverter'
import { GenericConverter } from './GenericConverter'

abstract class DAO<T extends Entity> {
  constructor(public entity: string) {
    this.converter = new GenericConverter<T>()
  }

  db = () => useFirestore()

  readonly converter: DataConverter<T>

  getById = (id?: string) => doc(this.db(), `${this.entity}/${id}`).withConverter(this.converter)

  getByPath = (path: Pathish<T>) => doc(this.db(), toPath(path)).withConverter(this.converter)

  getData = async (docRef?: Pathish<T>) => {
    return docRef ? (await getDoc(this.getByPath(docRef))).data() : undefined
  }

  getDataById = (id: string) => this.getData(this.getById(id))

  getDataByPath = (path: string) => this.getData(this.getByPath(path))

  aliasCollection = (name: string, parent?: DocumentReference) =>
    collection(this.db(), `${parent?.path}/${name}`).withConverter(this.converter)

  collection = (path?: string) =>
    collection(this.db(), path ? path : this.entity).withConverter(this.converter)

  nestedCollection = (parent: DocumentReference) => this.aliasCollection(this.entity, parent)

  subCollection = (parentPath: string) => this.nestedCollection(doc(this.db(), parentPath))

  collectionProxy = (parent: string, path?: string) =>
    new CollectionProxy(() => this.collection(`${parent}/${path ? path : this.entity}`))

  sortedActive = (sortTerm: string) =>
    query(this.collection(), where('retired', '==', false), orderBy(sortTerm))

  collectionToDocuments = async (collection: CollectionReference<T> | undefined) => {
    return collection ? (await getDocs(collection)).docs.map((doc) => doc.ref) : undefined
  }

  entities = async (collection: Query<T>) => {
    return (await getDocs(collection)).docs.map((d) => d.data())
  }

  entityList = async (documents: DocumentReference<T>[] | string[] | undefined) => {
    if (!documents) return undefined

    const entities: T[] = []
    for (const document of documents) {
      const ref = typeof document === 'string' ? this.getByPath(document) : document
      const entity = await this.getData(ref)
      if (entity) {
        entities.push(entity)
      }
    }
    return entities
  }

  list = async () => this.entities(this.collection())

  save = (entity: T) => {
    return setDoc(this.getByPath(entity.path), entity)
  }

  update = (path: string, fields: object) => {
    return updateDoc(this.getByPath(path), fields)
  }
}

export default DAO

export class CollectionProxy<T extends Entity> {
  constructor(public get: () => CollectionReference<T>) {}
}
