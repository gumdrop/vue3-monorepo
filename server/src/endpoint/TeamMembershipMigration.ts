import {
  TEAM_MEMBER_DOCUMENT_ID,
  type PathAndId,
  type Team,
  type TeamMember,
  type User,
  teamMemberPath,
} from '@quizleague/shared'
import { FieldValue } from '@google-cloud/firestore'
import { db, list, save } from '../storage/Storage'

type LegacyTeam = Team & { users?: unknown[] }

export interface TeamMembershipMigrationResult {
  teamsScanned: number
  teamsMigrated: number
  teamsSkipped: number
  usersMigrated: number
  legacyUserArraysDeleted: number
}

export async function migrateTeamMemberships(): Promise<TeamMembershipMigrationResult> {
  const teams = await list<LegacyTeam>('team')
  const result: TeamMembershipMigrationResult = {
    teamsScanned: teams.length,
    teamsMigrated: 0,
    teamsSkipped: 0,
    usersMigrated: 0,
    legacyUserArraysDeleted: 0,
  }

  for (const team of teams) {
    const users = legacyUserReferences(team.users)
    if (!users) {
      result.teamsSkipped += 1
      continue
    }

    await save<TeamMember>({
      id: TEAM_MEMBER_DOCUMENT_ID,
      path: teamMemberPath(team),
      users,
    })
    await db().doc(team.path).update({ users: FieldValue.delete() })

    result.teamsMigrated += 1
    result.usersMigrated += users.length
    result.legacyUserArraysDeleted += 1
  }

  return result
}

function legacyUserReferences(users: unknown[] | undefined): PathAndId<User>[] | undefined {
  if (!Array.isArray(users)) return undefined

  return users
    .map((user) => {
      const path = user && typeof user === 'object' ? (user as { path?: unknown }).path : undefined
      if (typeof path !== 'string') return undefined

      const id =
        typeof (user as { id?: unknown }).id === 'string'
          ? ((user as { id: string }).id)
          : (path.split('/').filter(Boolean).at(-1) ?? '')
      if (!id) return undefined

      return { id, path }
    })
    .filter((user): user is PathAndId<User> => Boolean(user))
}
