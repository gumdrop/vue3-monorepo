import { describe, it, expect } from 'vitest'

import { useKey } from '../KeyService'

describe('KeyService', () => {
  const { encode, decode } = useKey()

  it('should encode a key correctly', () => {
    const key = 'a/b/c/d'
    expect(encode(key)).toBe('a|b|c|d')
  })
  it('should decode an encoded key correctly', () => {
    const encoded = 'a|b|c|d'
    expect(decode(encoded)).toBe('a/b/c/d')
  })
})
