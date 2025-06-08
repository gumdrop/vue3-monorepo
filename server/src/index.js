"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.emulatorAddr = exports.isLocal = void 0;
var express_1 = __importDefault(require("express"));
var path_1 = __importDefault(require("path"));
var SiteEndpoints_1 = __importDefault(require("./endpoint/SiteEndpoints"));
var CalendarEndpoints_1 = __importDefault(require("./endpoint/CalendarEndpoints"));
var isLocal = function () { return true && process.env['FIRESTORE_EMULATOR_HOST']; };
exports.isLocal = isLocal;
var emulatorAddr = function () { return process.env['FIRESTORE_EMULATOR_HOST']; };
exports.emulatorAddr = emulatorAddr;
var app = (0, express_1.default)();
var bodyParser = function (req, res, next) {
    var data = '';
    req.setEncoding('utf8');
    req.on('data', function (chunk) {
        data += chunk;
    });
    req.on('end', function () {
        req.body = data;
        next();
    });
};
var indexMapping = function (req, res) {
    if (req.originalUrl.includes('/maintain/'))
        res.sendFile(path_1.default.join(global.__dirname + '/built/maintain/index.html'));
    else
        res.sendFile(path_1.default.join(global.__dirname + '/built/index.html'));
};
app.use(express_1.default.static('built'));
app.use(bodyParser);
var port = process.env['PORT'] || '8000';
(0, SiteEndpoints_1.default)(app);
(0, CalendarEndpoints_1.default)(app);
app.use('/', indexMapping).listen(port);
console.log("Server started on port ".concat(port));
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
