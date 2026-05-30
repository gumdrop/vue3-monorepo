import Express, { type Request, type Response } from 'express'
import Path from 'node:path'
import configureSite from './endpoint/SiteEndpoints'
import configureCalendar from './endpoint/CalendarEndpoints'
import configureMaintain from './endpoint/MaintainEndpoints'

export const isLocal = () => true && process.env['FIRESTORE_EMULATOR_HOST']
export const emulatorAddr = () => process.env['FIRESTORE_EMULATOR_HOST']

const app = Express()
const builtRoot = Path.join(process.cwd(), 'deploy', 'built')

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

app.use('/', indexMapping).listen(port)

if (isLocal()) {
  console.log(`Running against Firestore emulator at ${emulatorAddr()}`)
}

console.log(`Server started on port ${port}`)

export default app
