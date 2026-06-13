import type { Team, TeamMember, User } from '@quizleague/shared'
import { list } from '../storage/Storage'

export async function teamForUser(user: User) {
  const teams = await list<Team>('team')

  for (const team of teams) {
    const teamMember = (await list<TeamMember>('member', team))[0]
    const users = teamMember ? teamMember.users : []

    if (users.some((member) => member.id === user.id)) {
      return team
    }
  }
}
