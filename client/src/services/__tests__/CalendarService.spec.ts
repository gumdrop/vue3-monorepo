import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useCalendar } from '../CalendarService'

const mocks = vi.hoisted(() => ({
  competitionsOfType: vi.fn(),
  seasonDAO: {
    getDataById: vi.fn(),
  },
  venueDAO: {
    getData: vi.fn(),
  },
}))

vi.mock('../CompetitionService', () => ({
  useCompetitions: () => ({
    competitionsOfType: mocks.competitionsOfType,
  }),
}))

vi.mock('@/dao/SeasonDAO', () => ({
  default: mocks.seasonDAO,
}))

vi.mock('@/dao/VenueDAO', () => ({
  default: mocks.venueDAO,
}))

describe('CalendarService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.venueDAO.getData.mockImplementation(async (venue) => ({
      id: venue.id,
      path: venue.path,
      name: `Venue ${venue.id}`,
    }))
  })

  it('combines future singleton competition and season calendar events with venues', async () => {
    mocks.competitionsOfType.mockResolvedValue([
      {
        id: 'singleton-1',
        path: 'season/season-1/competition/singleton-1',
        name: 'Finals Night',
        _name: 'singleton',
        event: {
          date: '2999-01-03',
          time: '19:30',
          duration: 120,
          venue: { id: 'hall', path: 'venue/hall' },
        },
      },
    ])
    mocks.seasonDAO.getDataById.mockResolvedValue({
      id: 'season-1',
      calendar: [
        {
          description: 'Opening meeting',
          date: '2999-01-01',
          time: '20:00',
          duration: 60,
          venue: { id: 'club', path: 'venue/club' },
        },
        {
          description: 'Old meeting',
          date: '2000-01-01',
          time: '20:00',
          duration: 60,
        },
      ],
    })

    await expect(useCalendar().standaloneEvents('season-1')).resolves.toEqual([
      expect.objectContaining({
        description: 'Opening meeting',
        date: '2999-01-01',
        type: 'calendar',
        competition: undefined,
        venue: expect.objectContaining({ id: 'club' }),
      }),
      expect.objectContaining({
        description: 'Finals Night',
        date: '2999-01-03',
        type: 'competition',
        competition: expect.objectContaining({ id: 'singleton-1' }),
        venue: expect.objectContaining({ id: 'hall' }),
      }),
    ])
  })

  it('handles seasons without calendar data by returning future singleton events only', async () => {
    mocks.competitionsOfType.mockResolvedValue([
      {
        id: 'singleton-1',
        name: 'Future event',
        _name: 'singleton',
        event: {
          date: '2999-01-01',
          time: '19:30',
          duration: 120,
        },
      },
    ])
    mocks.seasonDAO.getDataById.mockResolvedValue(undefined)

    await expect(useCalendar().standaloneEvents('season-1')).resolves.toEqual([
      expect.objectContaining({
        description: 'Future event',
        date: '2999-01-01',
        type: 'competition',
      }),
    ])
    expect(mocks.venueDAO.getData).not.toHaveBeenCalled()
  })
})
