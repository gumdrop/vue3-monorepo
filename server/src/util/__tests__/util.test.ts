import { beforeEach, describe, expect, it, vi } from 'vitest'
import { log } from '../util'

describe('server util', () => {
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => undefined)
  })

  it('logs and returns the original value', () => {
    const value = { ok: true }

    expect(log(value, 'message')).toBe(value)
    expect(console.log).toHaveBeenCalledWith('message\n{"ok":true}')
  })
})
