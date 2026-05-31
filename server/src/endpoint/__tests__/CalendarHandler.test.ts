import { beforeEach, describe, expect, it, vi } from 'vitest'
import { teamCalendar } from '../CalendarHandler'
import { collection, list, load, runQuery, save } from '../../storage/Storage'

vi.mock('../../storage/Storage', () => ({
  collection: vi.fn(),
  list: vi.fn(),
  load: vi.fn(),
  runQuery: vi.fn(),
  save: vi.fn(),
}))

vi.mock('../util', () => ({
  applicationContext: vi.fn().mockResolvedValue({
    id: 'default',
    path: 'applicationcontext/default',
    leagueName: 'Chiltern Quiz League',
  }),
  currentSeason: vi.fn().mockResolvedValue({
    id: 'season-1',
    path: 'season/season-1',
    calendar: [
      {
        date: '2026-01-20',
        time: '19:30',
        duration: 7200,
        description: 'League AGM',
      },
    ],
  }),
}))

const query = {
  where: vi.fn(),
}

query.where.mockReturnValue(query)

describe('CalendarHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    query.where.mockReturnValue(query)
    vi.mocked(collection).mockReturnValue(query as never)
  })

  it('returns a fresh cached calendar entry without regenerating it', async () => {
    vi.mocked(runQuery).mockResolvedValue([
      {
        id: 'team-1',
        path: 'calendarcache/team-1',
        ical: 'cached calendar',
        updated: '2026-05-31T09:00:00',
      },
    ] as never)

    await expect(teamCalendar('team-1')).resolves.toBe('cached calendar')

    expect(collection).toHaveBeenCalledWith('calendarcache')
    expect(query.where).toHaveBeenCalledWith('id', '==', 'team-1')
    expect(query.where).toHaveBeenCalledWith('updated', '>', expect.any(String))
    expect(save).not.toHaveBeenCalled()
  })

  it('generates and caches a calendar when no fresh cache entry exists', async () => {
    const team = {
      id: 'team-1',
      path: 'team/team-1',
      name: 'Alpha Quiz Team',
      shortName: 'Alpha',
    }
    const opponent = {
      id: 'team-2',
      path: 'team/team-2',
      name: 'Bravo Quiz Team',
      shortName: 'Bravo',
    }
    const venue = {
      id: 'venue-1',
      path: 'venue/venue-1',
      name: 'Quiz Hall',
      address: '1 High Street\nTown',
    }
    const leagueCompetition = {
      id: 'league',
      path: 'season/season-1/competition/league',
      _name: 'league',
      name: 'League',
      duration: 7200,
    }
    const singletonCompetition = {
      id: 'finals',
      path: 'season/season-1/competition/finals',
      _name: 'singleton',
      name: 'Finals Night',
      event: {
        date: '2026-02-10',
        time: '19:30',
        duration: 7200,
        venue: { id: 'venue-1', path: 'venue/venue-1' },
      },
    }
    const fixtureSet = {
      id: 'week-1',
      path: 'season/season-1/competition/league/fixtures/week-1',
      date: '2026-01-13',
      start: '19:30',
      description: 'Week 1',
    }
    const fixture = {
      id: 'fixture-1',
      path: `${fixtureSet.path}/fixture/fixture-1`,
      home: { id: 'team-1', path: 'team/team-1' },
      away: { id: 'team-2', path: 'team/team-2' },
      venue: { id: 'venue-1', path: 'venue/venue-1' },
    }
    vi.mocked(runQuery).mockResolvedValue([] as never)
    vi.mocked(load).mockImplementation(async (pathish) => {
      const path = typeof pathish === 'string' ? pathish : 'path' in pathish ? pathish.path : ''
      if (path === 'team/team-1') return team as never
      if (path === 'team/team-2') return opponent as never
      if (path === 'venue/venue-1') return venue as never
      return undefined as never
    })
    vi.mocked(list).mockImplementation(async (type, parent) => {
      if (type === 'competition' && parent === 'season/season-1') {
        return [leagueCompetition, singletonCompetition] as never
      }
      if (type === 'fixtures' && parent === leagueCompetition.path) {
        return [fixtureSet] as never
      }
      if (type === 'fixture' && parent === fixtureSet.path) {
        return [fixture] as never
      }
      return [] as never
    })

    const ical = await teamCalendar('team-1')

    expect(ical).toContain('BEGIN:VCALENDAR')
    expect(ical).toContain('X-WR-CALNAME:Chiltern Quiz League calendar for Alpha Quiz Team')
    expect(ical).toContain('SUMMARY:Alpha - Bravo : League Week 1')
    expect(ical).toContain('LOCATION:Quiz Hall, 1 High Street,Town')
    expect(ical).toContain('SUMMARY:Chiltern Quiz League Finals Night')
    expect(ical).toContain('SUMMARY:League AGM')
    expect(ical).toContain('END:VCALENDAR')
    expect(save).toHaveBeenCalledWith(
      expect.objectContaining({
        path: 'calendarcache/team-1',
        ical,
        updated: expect.any(String),
      }),
    )
  })
})
