import type Season from '@/entity/Season'

export const useSeason = () => {
  function formatSeason(s: Season) {
    return s.startYear == s.endYear ? s.startYear.toString() : `${s.startYear}/${s.endYear}`
  }

  return { formatSeason }
}
