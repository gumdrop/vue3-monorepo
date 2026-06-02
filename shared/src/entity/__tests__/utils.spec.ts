import { describe, it, expect } from 'vitest'

import {
  factorForLegacyCompetition,
  isLegacyRef,
  isPathAndId,
  parseParent,
  SINGLETON_ID,
  TEAM_MEMBER_DOCUMENT_ID,
  teamMemberPath,
  toPath,
} from '../../index'

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

  it('normalizes pathish references with optional parent paths', () => {
    expect(toPath('text/front-page')).toBe('text/front-page')
    expect(toPath({ type: 'document', path: 'team/alpha' })).toBe('team/alpha')
    expect(toPath({ id: 'alpha', path: 'team' })).toBe('team/alpha')
    expect(toPath({ id: 'alpha', path: 'team/alpha/' })).toBe('team/alpha')
    expect(toPath({ id: 'copy', path: 'text' }, { id: 'season-1', path: 'season' })).toBe(
      'season/season-1/text/copy',
    )
  })

  it('recognizes legacy references and normalizes legacy paths', () => {
    const legacy = {
      typeName: 'competition',
      id: 'league',
      key: {
        parentKey: 'season/2026',
        entityName: 'competition',
        id: 'league',
      },
    }

    expect(isLegacyRef(legacy)).toBe(true)
    expect(isLegacyRef({ id: 'league', path: 'competition/league' })).toBe(false)
    expect(toPath(legacy)).toBe('season/2026/competition/league')
  })

  it('detects path/id references', () => {
    expect(isPathAndId({ id: 'alpha', path: 'team/alpha' })).toBe(true)
    expect(isPathAndId(null)).toBe(false)
    expect(isPathAndId({ path: 'team/alpha' })).toBe(false)
  })

  it('builds the singleton team membership document path', () => {
    expect(TEAM_MEMBER_DOCUMENT_ID).toBe('members')
    expect(teamMemberPath({ id: 'alpha', path: 'team/alpha' })).toBe(
      'team/alpha/member/members',
    )
  })

  it('unwraps legacy competition entities and exposes shared singleton constants', () => {
    expect(SINGLETON_ID).toBe('5659313586569216')
    expect(
      factorForLegacyCompetition({
        CupCompetition: {
          id: 'cup',
          name: 'Cup',
        },
      }),
    ).toEqual({
      id: 'cup',
      name: 'Cup',
      _name: 'cup',
    })
    expect(factorForLegacyCompetition({ id: 'league', _name: 'league' })).toEqual({
      id: 'league',
      _name: 'league',
    })
  })
})
