import { Application, Request, Response } from 'express'
import { teamCalendar } from './CalendarHandler'
import { param, sendText } from './util'

const root = '/calendar'

export default function configureCalendar(app: Application) {
  app.get(`${root}/team/:teamId`, getTeamCalendar)
}

async function getTeamCalendar(req: Request, res: Response) {
  const ical = teamCalendar(param('teamId', req))
  res.contentType('text/calendar')
  sendText(ical, res)
}
