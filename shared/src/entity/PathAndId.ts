import type Entity from './Entity'
import { isLegacyRef } from './utils'

export type Pathish<T extends Entity> = string | PathAndId<T> | DocRef | LegacyRef

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export interface PathAndId<T extends Entity> {
  id: string
  path: string
}

export interface DocRef {
  type?: 'document'
  path: string
}

export interface LegacyRef {
  typeName: string
  id: string
  key: {
    parentKey: string
    entityName: string
    id: string
  }
}

export function toPath<T extends Entity>(child: Pathish<T>, parent?: Pathish<T>): string {
  function resolvePath(path: Pathish<T>) {
    if (path && path.hasOwnProperty('path')) {
      const p = path as PathAndId<T>
      return `${p.path}/${p.id}`
    } else if (
      (path && path.hasOwnProperty('type') && (path as DocRef).type === 'document') ||
      path.hasOwnProperty('_path')
    ) {
      return (path as DocRef).path
    } else if (isLegacyRef(path)) {
      const ref = path as LegacyRef
      return `${ref.key.parentKey}/${ref.typeName}/${ref.id}`
    }
    return `${path}`
  }

  const childPath = resolvePath(child)

  return parent ? `${resolvePath(parent)}/${childPath}` : childPath
}

export function isPathAndId(obj: unknown): boolean {
  return obj !== null && typeof obj === 'object' && 'id' in obj && 'path' in obj
}
