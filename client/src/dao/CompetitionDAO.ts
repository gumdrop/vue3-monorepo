import type Competition from '@/entity/Competition'
import DAO from './DAO'

class CompetitionDAO extends DAO<Competition> {
  constructor() {
    super('competition')
  }
}

// class CompetitionConverter extends DataConverter<Competition> {
//     buildObject(data: DocumentData, key: string): Competition {

//         if(Object.hasOwn(data,"LeagueCompetition")){

//             const comp = data.LeagueCompetition

//             return new LeagueCompetition(
//                 comp.id,
//                 comp.name,
//                 this.makeDocumentRef(comp.text, TextDAO.converter),
//                 comp.startTime,
//                 comp.duration,
//                 FixturesDAO.collectionProxy(key),
//                 comp.icon,
//                 key
//             )
//         }

//         if(Object.hasOwn(data,"CupCompetition")){

//             const comp = data.CupCompetition

//             return new CupCompetition(
//                 comp.id,
//                 comp.name,
//                 this.makeDocumentRef(comp.text, TextDAO.converter),
//                 comp.startTime,
//                 comp.duration,
//                 FixturesDAO.collectionProxy(key),
//                 comp.textName,
//                 comp.icon,
//                 key
//             )
//         }

//         if(Object.hasOwn(data,"SubsidiaryLeagueCompetition")){

//             const comp = data.SubsidiaryLeagueCompetition

//             return new SubsidiaryLeagueCompetition(
//                 comp.id,
//                 comp.name,
//                 this.makeDocumentRef(comp.text, TextDAO.converter),
//                 comp.startTime,
//                 comp.duration,
//                 FixturesDAO.collectionProxy(key),
//                 comp.icon,
//                 key
//             )
//         }

//         if(Object.hasOwn(data,"SingletonCompetition")){

//             const comp = data.SingletonCompetition

//             return new SingletonCompetition(
//                 comp.id,
//                 comp.name,
//                 this.makeDocumentRef(comp.text, TextDAO.converter),
//                 comp.startTime,
//                 comp.duration,
//                 comp.textName,
//                 comp.event ? new Event(comp.event.date, comp.event.time, comp.event.duration, this.makeDocumentRef(comp.event.venue, VenueDAO.converter)) : undefined,
//                 comp.icon,
//                 key
//             )
//         }

//         throw new Error(`No handler for competition type in ${JSON.stringify(data)}`)

//      }

// }

export default new CompetitionDAO()
