import type Team from '@/entity/Team'
import type TeamMember from '@/entity/TeamMember'
import {
  TEAM_MEMBER_DOCUMENT_ID,
  teamMemberPath,
  type PathAndId,
  type Pathish,
} from '@quizleague/shared'
import type User from '@/entity/User'
import DAO from './DAO'

class TeamMemberDAO extends DAO<TeamMember> {
  constructor() {
    super('member')
  }

  getByTeam = (team: Pathish<Team>) => this.getByPath(teamMemberPath(team))

  getDataForTeam = (team: Pathish<Team>) => this.getData(this.getByTeam(team))

  saveForTeam = (team: Pathish<Team>, users: PathAndId<User>[]) =>
    this.save({
      id: TEAM_MEMBER_DOCUMENT_ID,
      path: teamMemberPath(team),
      users,
    })
}

export default new TeamMemberDAO()
