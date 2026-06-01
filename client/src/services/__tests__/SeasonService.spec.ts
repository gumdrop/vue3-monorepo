import { describe, expect, it } from 'vitest'

import { useSeason } from '../SeasonService'

describe('SeasonService', () => {
  it('formats single-year seasons without a slash', () => {
    expect(useSeason().formatSeason({ startYear: 2026, endYear: 2026 } as never)).toBe('2026')
  })

  it('formats multi-year seasons with both years', () => {
    expect(useSeason().formatSeason({ startYear: 2025, endYear: 2026 } as never)).toBe('2025/2026')
  })
})
