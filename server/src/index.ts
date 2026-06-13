import Express, { type Request, type Response } from 'express'
import Path from 'node:path'
import { existsSync } from 'node:fs'
import configureSite from './endpoint/SiteEndpoints'
import configureCalendar from './endpoint/CalendarEndpoints'
import configureMaintain from './endpoint/MaintainEndpoints'
import configureNotifications from './endpoint/NotificationEndpoints'

export const isLocal = () => true && process.env['FIRESTORE_EMULATOR_HOST']
export const emulatorAddr = () => process.env['FIRESTORE_EMULATOR_HOST']

const app = Express()
const builtRootCandidates = [
  Path.join(process.cwd(), 'deploy', 'built'),
  Path.join(process.cwd(), 'built'),
]
const builtRoot = builtRootCandidates.find((path) => existsSync(path)) ?? builtRootCandidates[0]

const bodyParser = (req: Request, res: Response, next: () => void) => {
  let data = ''
  req.setEncoding('utf8')
  req.on('data', (chunk) => {
    data += chunk
  })
  req.on('end', () => {
    req.body = data
    next()
  })
}

const indexMapping = (req: Request, res: Response) => {
  let path = 'index.html'
  if (req.originalUrl.includes('/maintain/')) {
    path = 'maintain/index.html'
  }
  res.sendFile(Path.join(builtRoot, path))
}

app.use(Express.static(builtRoot))
app.use(bodyParser)

const port = process.env['PORT'] || '8000'

configureSite(app)
configureCalendar(app)
configureMaintain(app)
configureNotifications(app)

app.use('/rest', (req: Request, res: Response) => {
  res.status(404).json({ error: `Unknown REST endpoint: ${req.method} ${req.originalUrl}` })
})

app.use('/', indexMapping).listen(port)

if (isLocal()) {
  console.log(`Running against Firestore emulator at ${emulatorAddr()}`)
}

console.log(`Server started on port ${port}`)

export default app
