import { Application, Request, Response } from 'express'
import type { ResultsSubmitCommand } from '@quizleague/shared'
import { siteUserForEmail } from './SiteFunctions'
import { resultSubmission } from './TaskFunctions'
import { param, send } from './util'

const root = '/rest/site'

export default function configure(app: Application) {
  app
    .post(`${root}/result/submit`, postResultSubmit)
    .get(`${root}/site-user-for-email/:email`, getSiteUserForEmail)
  //.post(`$root/save-site-user`, postSaveSiteUser _)
  // .post(`$root/email/team`, postEmailTeam)
  // .post(`$root/email/alias`, postEmailAlias)
  // .post(`$root/chat/notifications`, postChatNotifications)
}

function postResultSubmit(req: Request, res: Response) {
  send(
    Promise.resolve().then(async () => {
      await resultSubmission(parseBody<ResultsSubmitCommand>(req))
      return { ok: true }
    }),
    res,
  )
}

function parseBody<T>(req: Request) {
  return (typeof req.body === 'string' ? JSON.parse(req.body) : req.body) as T
}

// function postTeamForEmail(req: Request, res: Response){ param("email",req).foreach(email => send(teamForEmail(email),res))}
function getSiteUserForEmail(req: Request, res: Response) {
  send(siteUserForEmail(param('email', req)), res)
}
// function postSaveSiteUser(req: Request, res: Response){ send(saveSiteUser(parse[SiteUser](req)), res)}
// function postEmailTeam(req: Request, res: Response){ send(contactTeam(parse[TeamEmailCommand](req)), res)}
// function postEmailAlias(req: Request, res: Response){ send(contactPerson(parse[AliasEmailCommand](req)), res)}
// function postChatNotifications(req:Request, res: Response){ send(chatNotifications(parse[ChatNotificationCommand](req)), res)}
