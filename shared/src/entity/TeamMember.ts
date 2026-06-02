import type Entity from './Entity'
import type { PathAndId, Pathish } from './PathAndId'
import { toPath } from './PathAndId'
import type { Team } from './Team'
import type { User } from './User'

export const TEAM_MEMBER_DOCUMENT_ID = 'members'

export interface TeamMember extends Entity {
  users: PathAndId<User>[]
}

export function teamMemberPath(team: Pathish<Team>) {
  return `${toPath(team)}/member/${TEAM_MEMBER_DOCUMENT_ID}`
}
