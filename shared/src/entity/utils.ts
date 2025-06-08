export function isLegacyRef(obj:unknown){
  return obj !== null && typeof obj === 'object' && 'id' in obj && 'typeName' in obj && true
}

export function parseParent(key: string | undefined | null) {
  const parts = key ? key.replace(/\/$/, '').split('/') : []

  if (parts.length > 2) {
    return parts.slice(0, parts.length - 2).join('/')
  }

  return ''
}
