import Express, { Request, Response } from 'express'
import Path from 'node:path'
import configureSite from './endpoint/SiteEndpoints'
import configureCalendar from './endpoint/CalendarEndpoints'

export const isLocal = () => true && process.env['FIRESTORE_EMULATOR_HOST']
export const emulatorAddr = () => process.env['FIRESTORE_EMULATOR_HOST']

const app = Express()

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
  let path = 'built/index.html'
  if (req.originalUrl.includes('/maintain/')) {
    path = 'built/maintain/index.html'
  }
  res.sendFile(Path.join(`${__dirname}/${path}`))
}

app.use(Express.static(Path.join(`${__dirname}/built`)))
app.use(bodyParser)

const port = process.env['PORT'] || '8000'

configureSite(app)
configureCalendar(app)

app.use('/', indexMapping).listen(port)

console.log(`Server started on port ${port}`)

export default app
