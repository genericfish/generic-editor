const http = require("http")
const express = require("express")
const ShareDB = require("sharedb")
const ShareDBMongo = require("sharedb-mingo-memory")
const WebSocket = require("ws")
const WebSocketJSONStream = require("@teamwork/websocket-json-stream")
const multer = require('multer')

let share = new ShareDB({db: new ShareDBMongo()})

let app = express();
app.use(express.static('static'))

let server = http.createServer(app)
let wss = new WebSocket.Server({server: server})

server.listen(8248)

wss.on('connection', (ws) => { share.listen(new WebSocketJSONStream(ws)) })

let con = share.connect();
con.createFetchQuery("test2", {}, {}, (err, results) => {
    if (err) throw err;

    if (results.length === 0) {
        let doc = con.get("test2", "auniqueidhere")
        doc.create({content: ""})
    }
})

let upload = multer({
    // TODO: Replace with custom engine
    storage: multer.diskStorage({
        destination: (req, file, cb) => {
            cb(null, "uploads/")
        },
        filename: (req, file, cb) => {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
            cb(null, file.fieldname + '-' + uniqueSuffix + '.png')
        }
    })
})

app.post("/upload", upload.single("image", 12), (req, res, next) => {
    res.redirect("/")
})