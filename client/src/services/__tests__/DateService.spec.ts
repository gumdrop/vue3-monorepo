import { describe, it, expect } from 'vitest'

import { useDateTime } from '../DateService'

describe('DateService', () => {
  const { date, time, datetime, zoneddatetime } = useDateTime()

  it('should format a date correctly', () => {
    const dateStr = '2025-01-02'

    expect(date(dateStr, 'd MMMM yyyy')).toBe('2 January 2025')
  })

  it('formats times, datetimes, and zoned datetimes', () => {
    expect(time('19:30:15', 'HH:mm')).toBe('19:30')
    expect(datetime('2025-01-02T19:30:15', 'd MMM yyyy HH:mm')).toBe('2 Jan 2025 19:30')
    expect(zoneddatetime('2025-01-02T19:30:15Z', 'd MMM yyyy HH:mm')).toBe('2 Jan 2025 19:30')
  })

  it('returns undefined for missing values', () => {
    expect(date(undefined, 'd MMMM yyyy')).toBeUndefined()
    expect(time(undefined, 'HH:mm')).toBeUndefined()
    expect(datetime(undefined, 'd MMM yyyy HH:mm')).toBeUndefined()
    expect(zoneddatetime(undefined, 'd MMM yyyy HH:mm')).toBeUndefined()
  })
})
