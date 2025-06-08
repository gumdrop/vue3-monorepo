import Express, { Request, Response } from 'express'
import Path from 'path'
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
  if (req.originalUrl.includes('/maintain/'))
    res.sendFile(Path.join(global.__dirname + '/built/maintain/index.html'))
  else res.sendFile(Path.join(global.__dirname + '/built/index.html'))
}

app.use(Express.static('built'))
app.use(bodyParser)

const port = process.env['PORT'] || '8000'

configureSite(app)
configureCalendar(app)

app.use('/', indexMapping).listen(port)

console.log(`Server started on port ${port}`)

// object App {

//   val isLocal = Process.env("FIRESTORE_EMULATOR_HOST").isDefined
//   val emulatorAddr = Process.env("FIRESTORE_EMULATOR_HOST").getOrElse("")

//   def main(args: Array[String]): Unit = {
//     // create the Express application instance
//     val app = Express()
//     app.use(Express.static("built"))
//     app.use(bodyParser);

//     // define a port
//     val port = Process.env("PORT").getOrElse("8080")

//     // setup the server with routes
//     EntityEndpoints.configure(app)
//     SiteEndpoints.configure(app)
//     CalendarEndpoints.configure(app)
//     val server = app
//       .use("/", indexMapping)
//       .listen(port)

//     println(s"Server started on port $port")
//     Process.env("FIRESTORE_EMULATOR_HOST").foreach(port => println(s"emulator address : $port"))
//   }

//   val indexMapping:js.Any = (req: Request, res: Response) => {
//     if (req.originalUrl.contains("/maintain/"))
//       res.sendFile(Path.join(js.Dynamic.global.__dirname.toString + "/built/maintain/index.html"))
//     else
//       res.sendFile(Path.join(js.Dynamic.global.__dirname.toString + "/built/index.html"))
//   }

//   val bodyParser:js.Any = {(req:js.Dynamic, res:Request, next:js.Function0[Unit]) =>{
//       var data = ""
//       req.setEncoding("utf8")
//       req.on("data", (chunk:js.Any) => {
//         data += chunk;
//       }
//       );
//       req.on("end", () => {
//         req.body = data;
//         next()
//       }
//       );
//     }}:js.Function

// }
