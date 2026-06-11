import type { PathAndId } from './PathAndId'
import type Entity from './Entity'
import type { Event } from './Event'
import type { Text } from './Text'

export type name = 'league' | 'cup' | 'subsidiary' | 'singleton'

export interface Competition extends Entity {
  name: string
  text: PathAndId<Text>
  duration: number
  roundup?: PathAndId<Text>
  roundupGeneratedAt?: string
  roundupModel?: string
  readonly _name: name
  icon?: string
  readonly _type: string
}

export interface LeagueCompetition extends Competition {
  startTime: string
  duration: number
  win: number
  loss: number
  draw: number
  textName: string
}

export interface CupCompetition extends Competition {
  startTime: string
  duration: number
  textName: string
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface SubsidiaryLeagueCompetition
  extends Omit<LeagueCompetition, 'startTime' | 'duration'> {}

export interface SingletonCompetition extends Competition {
  startTime: string
  duration: number
  textName: string
  event?: Event
}

const legacyCompetitionKeys = new Map<string,string>()
legacyCompetitionKeys.set('LeagueCompetition','league',)
legacyCompetitionKeys.set('CupCompetition','cup',)
legacyCompetitionKeys.set('SingletonCompetition','singleton',)
legacyCompetitionKeys.set('SubsidiaryLeagueCompetition','subsidiary',)


// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function factorForLegacyCompetition(obj: any) {
  for (const key of legacyCompetitionKeys.keys()) {
    if (key in obj) {
      return {...obj[key],'_name':legacyCompetitionKeys.get(key)}
    }
  }

  return obj
}
