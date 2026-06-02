import { beforeEach, describe, expect, it, vi } from 'vitest'
import { migrateTeamMemberships } from '../TeamMembershipMigration'
import { db, list, save } from '../../storage/Storage'

const mocks = vi.hoisted(() => ({
  doc: vi.fn(),
  update: vi.fn(),
}))

vi.mock('../../storage/Storage', () => ({
  db: vi.fn(() => ({
    doc: mocks.doc,
  })),
  list: vi.fn(),
  save: vi.fn(),
}))

describe('TeamMembershipMigration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.doc.mockReturnValue({ update: mocks.update })
    mocks.update.mockResolvedValue(undefined)
    vi.mocked(save).mockResolvedValue({ id: 'members', path: 'team/alpha/member/members' } as never)
  })

  it('migrates legacy team user arrays into singleton member documents', async () => {
    vi.mocked(list).mockResolvedValue([
      {
        id: 'alpha',
        path: 'team/alpha',
        users: [{ id: 'alice', path: 'user/alice' }],
      },
      {
        id: 'bravo',
        path: 'team/bravo',
        users: [{ path: 'user/bob' }],
      },
      {
        id: 'charlie',
        path: 'team/charlie',
      },
    ] as never)

    await expect(migrateTeamMemberships()).resolves.toEqual({
      teamsScanned: 3,
      teamsMigrated: 2,
      teamsSkipped: 1,
      usersMigrated: 2,
      legacyUserArraysDeleted: 2,
    })

    expect(save).toHaveBeenCalledWith({
      id: 'members',
      path: 'team/alpha/member/members',
      users: [{ id: 'alice', path: 'user/alice' }],
    })
    expect(save).toHaveBeenCalledWith({
      id: 'members',
      path: 'team/bravo/member/members',
      users: [{ id: 'bob', path: 'user/bob' }],
    })
    expect(db).toHaveBeenCalled()
    expect(mocks.doc).toHaveBeenCalledWith('team/alpha')
    expect(mocks.doc).toHaveBeenCalledWith('team/bravo')
    expect(mocks.update).toHaveBeenCalledTimes(2)
    expect(mocks.update.mock.calls[0][0]).toHaveProperty('users')
  })
})
