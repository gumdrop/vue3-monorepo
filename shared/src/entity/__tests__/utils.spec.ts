import { describe, it, expect } from 'vitest'

import { parseParent } from '../utils'

describe('utils', () => {
  it('should parse parent key when present', () => {
    const key = 'a/b/c/d'

    expect(parseParent(key)).toBe('a/b')
  })

  it('should parse parent key as empty string when not present', () => {
    const key = 'a/b'

    expect(parseParent(key)).toBe('')
  })

  it('should ignore terminal /', () => {
    const key = 'a/b/c/d/'

    expect(parseParent(key)).toBe('a/b')
  })
})
