import { DocumentReference, Firestore, Query } from '@google-cloud/firestore'
import { Entity, EntityType, Pathish, toPath } from '@quizleague/shared'
import { emulatorAddr, isLocal } from '..'
import { GenericConverter } from './GenericConverter'
import _ from 'lodash'

let _db: Firestore

const localProjectId = () => process.env['FIREBASE_PROJECT_ID'] ?? 'chiltern-ql-firestore'

const db = () => {
  if (!_db) {
    if (isLocal()) {
      _db = new Firestore({ projectId: localProjectId() })
      _db.settings({ host: emulatorAddr(), ssl: false })
    } else {
      _db = new Firestore()
    }
  }
  return _db
}

const _converter = new GenericConverter()
function converter<T extends Entity>() {
  return _converter as GenericConverter<T>
}

export async function save<T extends Entity>(entity: T) {
  const ref = docRef<T>(entity.path).withConverter(converter<T>())
  await ref.set(entity)
  return ref
}

export async function saveAll<T extends Entity>(entities: T[]) {
  const batchSets: T[][] = _.chunk(entities, 400)

  for (const set of batchSets) {
    const batch = db().batch()
    for (const obj of set) {
      batch.set(docRef(obj.path), obj)
    }
    await batch.commit()
  }
}

async function getData<T extends Entity>(doc: DocumentReference<T>) {
  return (await doc.withConverter(converter()).get()).data() as T
}

export async function load<T extends Entity>(pathish: Pathish<T>) {
  return getData<T>(docRef(pathish))
}

export function docRef<T extends Entity>(pathish: Pathish<T>) {
  return db().doc(toPath(pathish)).withConverter(converter<T>())
}

export const entityPath = (path: EntityType, id: string) => `${path}/${id}`

export function docRefById<T extends Entity>(path: EntityType, id: string) {
  return docRef<T>(entityPath(path, id))
}

export function collection<T extends Entity>(entityType: EntityType, parent?: Pathish<T>) {
  return db().collection(toPath(entityType, parent)).withConverter(converter<T>())
}

export function list<T extends Entity>(entityType: EntityType, parent?: Pathish<T>) {
  return runQuery(collection<T>(entityType, parent))
}

export async function runQuery<T extends Entity>(query: Query<T>) {
  const docs = (await query.get()).docs
  return docs.map((doc) => doc.data())
}

export async function delete1<T extends Entity>(entity: T) {
  deleteAll([entity])
}

export async function deleteAll<T extends Entity>(entities: T[]) {
  const batchSets: T[][] = _.chunk(entities, 400)

  for (const set of batchSets) {
    const batch = db().batch()
    for (const obj of set) {
      batch.delete(docRef(obj.path))
    }
    await batch.commit()
  }
}

export { db }
