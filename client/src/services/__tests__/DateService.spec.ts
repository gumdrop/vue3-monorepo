import { describe, it, expect } from 'vitest'

import { useDateTime } from '../DateService'

describe('DateService', () => {
  const { date } = useDateTime()

  it('should format a date correctly', () => {
    const dateStr = '2025-01-02'

    expect(date(dateStr, 'd MMMM yyyy')).toBe('2 January 2025')
  })
})
