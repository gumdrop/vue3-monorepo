"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = configure;
var SiteFunctions_1 = require("./SiteFunctions");
var util_1 = require("./util");
var root = "/rest/site";
function configure(app) {
    app
        // .post(`$root/result/submit`,  postResultSubmit)
        .get("".concat(root, "/site-user-for-email/:email"), getSiteUserForEmail);
    //.post(`$root/save-site-user`, postSaveSiteUser _)
    // .post(`$root/email/team`, postEmailTeam)
    // .post(`$root/email/alias`, postEmailAlias)
    // .post(`$root/chat/notifications`, postChatNotifications)
}
// function postResultSubmit(req: Request, res: Response){ send(submitResult(parse[ResultsSubmitCommand](req)),res)}
// function postTeamForEmail(req: Request, res: Response){ param("email",req).foreach(email => send(teamForEmail(email),res))}
function getSiteUserForEmail(req, res) {
    (0, util_1.send)((0, SiteFunctions_1.siteUserForEmail)((0, util_1.param)('email', req)), res);
}
// function postSaveSiteUser(req: Request, res: Response){ send(saveSiteUser(parse[SiteUser](req)), res)}
// function postEmailTeam(req: Request, res: Response){ send(contactTeam(parse[TeamEmailCommand](req)), res)}
// function postEmailAlias(req: Request, res: Response){ send(contactPerson(parse[AliasEmailCommand](req)), res)}
// function postChatNotifications(req:Request, res: Response){ send(chatNotifications(parse[ChatNotificationCommand](req)), res)}
