import type { PathAndId } from './PathAndId'
import type Entity from './Entity'
import type { GlobalText } from './GlobalText'
import type { Season } from './Season'
import type { User } from './User'

export interface ApplicationContext extends Entity {
  leagueName: string
  textSet: PathAndId<GlobalText>
  currentSeason: PathAndId<Season>
  senderEmail: string
  emailAliases: { alias: string; user: PathAndId<User> }[]
  cloudStoreBucket: string
}

export const SINGLETON_ID = '5659313586569216'
