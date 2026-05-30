import { describe, expect, it } from 'vitest'
import type Team from '@/entity/Team'
import type { Fixture } from '@/entity/Fixtures'
import {
  applyHomeTeamSelection,
  availableTeamsForFixtureSlot,
  canSaveFixtureEdit,
  toFixtureEntity,
  unallocatedFixtureTeams,
} from '../fixtureEditHelpers'

const team = (id: string, venueId = `${id}-venue`): Team =>
  ({
    id,
    path: `team/${id}`,
    name: id,
    shortName: id,
    venue: { id: venueId, path: `venue/${venueId}` },
    text: { id: `${id}-text`, path: `text/${id}-text` },
    users: [],
    retired: false,
  }) as Team

const fixture = (id: string, homeId: string, awayId: string): Partial<Fixture> => ({
  id,
  path: `fixtures/${id}`,
  home: { id: homeId, path: `team/${homeId}` } as Fixture['home'],
  away: { id: awayId, path: `team/${awayId}` } as Fixture['away'],
})

describe('fixture edit helpers', () => {
  const teams = [team('alpha'), team('bravo'), team('charlie'), team('delta'), team('echo')]

  it('returns teams not already allocated to the fixture set', () => {
    expect(unallocatedFixtureTeams(teams, [fixture('fixture-1', 'alpha', 'bravo')]).map((t) => t.id)).toEqual([
      'charlie',
      'delta',
      'echo',
    ])
  })

  it('keeps the current fixture team selectable while excluding the other slot and other fixtures', () => {
    const fixtures = [fixture('fixture-1', 'alpha', 'bravo'), fixture('fixture-2', 'charlie', 'delta')]
    const fixtureToEdit = {
      id: 'fixture-1',
      homePath: 'team/alpha',
      awayPath: 'team/bravo',
    }

    expect(availableTeamsForFixtureSlot(teams, fixtures, fixtureToEdit, 'home').map((t) => t.id)).toEqual([
      'alpha',
      'echo',
    ])
    expect(availableTeamsForFixtureSlot(teams, fixtures, fixtureToEdit, 'away').map((t) => t.id)).toEqual([
      'bravo',
      'echo',
    ])
  })

  it('sets the venue from the selected home team', () => {
    const edit = applyHomeTeamSelection({ awayPath: 'team/bravo', venuePath: 'venue/old' }, teams, 'team/alpha')

    expect(edit).toMatchObject({
      homePath: 'team/alpha',
      awayPath: 'team/bravo',
      venuePath: 'venue/alpha-venue',
    })
  })

  it('clears the home team and venue when no home team is selected', () => {
    const edit = applyHomeTeamSelection({ homePath: 'team/alpha', venuePath: 'venue/alpha-venue' }, teams, null)

    expect(edit.homePath).toBe('')
    expect(edit.venuePath).toBe('')
  })

  it('allows saving only when home and away teams are different', () => {
    expect(canSaveFixtureEdit({ homePath: 'team/alpha', awayPath: 'team/bravo' })).toBe(true)
    expect(canSaveFixtureEdit({ homePath: 'team/alpha', awayPath: 'team/alpha' })).toBe(false)
    expect(canSaveFixtureEdit({ homePath: 'team/alpha' })).toBe(false)
  })

  it('removes edit-only path fields from saved fixture entities', () => {
    const saved = toFixtureEntity({
      ...fixture('fixture-1', 'alpha', 'bravo'),
      homePath: 'team/alpha',
      awayPath: 'team/bravo',
      venuePath: 'venue/alpha-venue',
    })

    expect(saved).toMatchObject({
      home: expect.objectContaining({ path: 'team/alpha' }),
      away: expect.objectContaining({ path: 'team/bravo' }),
    })
    expect(saved).not.toHaveProperty('homePath')
    expect(saved).not.toHaveProperty('awayPath')
    expect(saved).not.toHaveProperty('venuePath')
  })
})
