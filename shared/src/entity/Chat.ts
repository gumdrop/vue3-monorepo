import type { PathAndId } from "./PathAndId"
import type Entity from "./Entity"
import type {SiteUser} from "./SiteUser"

export interface Chat extends Entity {
  name?:string
}

export interface ChatMessage extends Entity {
  user:PathAndId<SiteUser>
  message:string
  date:string
  index:string[]
}


