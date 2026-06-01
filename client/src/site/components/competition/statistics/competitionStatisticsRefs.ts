import type Entity from '@/entity/Entity'
import {
  isLegacyRef,
  toPath,
  type CompetitionStatisticsReference,
  type Pathish,
} from '@quizleague/shared'

type InternalFirestorePath = {
  canonicalString?: () => string
  segments?: string[]
}

type FirestoreReferenceLike = {
  path?: unknown
  _path?: InternalFirestorePath
  _key?: {
    path?: InternalFirestorePath
  }
}

const pathFromSegments = (segments: string[]) => {
  const documentsIndex = segments.indexOf('documents')
  const documentPathSegments = documentsIndex >= 0 ? segments.slice(documentsIndex + 1) : segments

  return documentPathSegments.join('/')
}

const internalPath = (path?: InternalFirestorePath) => {
  if (!path) return ''

  if (typeof path.canonicalString === 'function') {
    return path.canonicalString()
  }

  return Array.isArray(path.segments) ? pathFromSegments(path.segments) : ''
}

export const referencePath = (reference?: CompetitionStatisticsReference) => {
  if (!reference) return ''

  if (typeof reference === 'string') return reference

  if (typeof reference === 'object') {
    const referenceLike = reference as FirestoreReferenceLike

    if (typeof referenceLike.path === 'string') return referenceLike.path

    if (isLegacyRef(reference)) {
      return toPath(reference as Pathish<Entity>)
    }

    const extractedPath =
      internalPath(referenceLike._path) || internalPath(referenceLike._key?.path)
    if (extractedPath) return extractedPath
  }

  const resolvedPath = toPath(reference as Pathish<Entity>)
  return resolvedPath === '[object Object]' ? '' : resolvedPath
}

export const referenceId = (reference?: CompetitionStatisticsReference) => {
  const pathParts = referencePath(reference).split('/').filter(Boolean)
  return pathParts[pathParts.length - 1] ?? ''
}
