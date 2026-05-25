import { describe, expect, it } from 'vitest'
import { isLocalHost } from '../localHost'

describe('isLocalHost', () => {
  it('matches local browser hostnames used by the dev server', () => {
    expect(isLocalHost('localhost')).toBe(true)
    expect(isLocalHost('127.0.0.1')).toBe(true)
    expect(isLocalHost('::1')).toBe(true)
    expect(isLocalHost('[::1]')).toBe(true)
  })

  it('does not match deployed hostnames', () => {
    expect(isLocalHost('chilternquizleague.uk')).toBe(false)
  })
})
