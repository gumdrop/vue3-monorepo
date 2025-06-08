import { LocalDate } from '@js-joda/core'
import { useCompetitions } from './CompetitionService'
import SeasonDAO from '@/dao/SeasonDAO'
import type { SingletonCompetition } from '@/entity/Competition'
import type { EventWrapper } from '@/entity/Event'
import VenueDAO from '@/dao/VenueDAO'

export const useCalendar = () => {
  const { competitionsOfType } = useCompetitions()

  const standaloneEvents = async (seasonId: string) => {
    const now = LocalDate.now().toString()
    const comps: SingletonCompetition[] = await competitionsOfType(seasonId, 'singleton')
    const season = await SeasonDAO.getDataById(seasonId)

    const singletons = comps
      .filter((cs) => cs.event)
      .map((cs) => {
        return {
          ...cs.event,
          description: cs.name,
          competition: cs,
          type: 'competition',
        }
      })
    const seasonEvents = season
      ? season.calendar.map((e) => {
          return { ...e, type: 'calendar', competition: undefined }
        })
      : []

    const events: EventWrapper[] = []

    for (const event of singletons) {
      const venue = event.venue ? await VenueDAO.getData(event.venue) : undefined
      const wrapper: EventWrapper = { ...event, venue } as EventWrapper
      events.push(wrapper)
    }

    for (const event of seasonEvents) {
      const venue = event.venue ? await VenueDAO.getData(event.venue) : undefined
      const wrapper: EventWrapper = { ...event, venue } as EventWrapper
      events.push(wrapper)
    }

    return events.filter((e) => e.date > now).sort((a, b) => a.date.localeCompare(b.date))
  }

  return { standaloneEvents }
  // def standaloneEvents(seasonId:String):Observable[js.Array[EventWrapper]] = {
  //   val now = LocalDate.now().toString

  //   val comps = CompetitionService.firstClassCompetitions(seasonId)
  //   val season = SeasonService.get(seasonId)
  //   standaloneEvents(comps, season)
  //     .map(_.filter(_.date >= now).sortBy(_.date))
  // }

  // private def standaloneEvents(comps:Observable[js.Array[Competition]], season: Observable[Season]):Observable[js.Array[EventWrapper]] = {
  //    def singletonEvents(c: Competition): js.Array[EventWrapper] = c match {
  //     case s: SingletonCompetition => js.Array(EventWrapper(s.event, c))
  //     case _ => js.Array()
  //   }

  //   def singletons = comps.map(cs => cs.flatMap(singletonEvents))

  //   def seasons = season.map(s => s.calendar.map(e => EventWrapper(e)))

  //   singletons.combineLatest(seasons).map((a, b) => a ++ b)
  // }
}
