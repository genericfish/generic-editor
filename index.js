const http = require("http")
const express = require("express")
const ShareDB = require("sharedb")
const ShareDBMongo = require("sharedb-mingo-memory")
const WebSocket = require("ws")
const WebSocketJSONStream = require("@teamwork/websocket-json-stream")
const multer = require('multer')

const GoogleStorageEngine = require('./storageEngine')

let upload = multer({
    storage: GoogleStorageEngine(),
    limits: {
        fieldSize: 2048,
        fileSize: 1E7
    }
})

let share = new ShareDB({db: new ShareDB.MemoryDB()})

let connection = share.connect()

let app = express();
app.use(express.static('static'))

let server = http.createServer(app)
let wss = new WebSocket.Server({server: server})

server.listen(8248)

wss.on('connection', (ws) => { share.listen(new WebSocketJSONStream(ws)) })

app.post("/upload", (req, res, next) => {
    upload.single("image")(req, res, err => {
        if (err) console.error("Error while uploading file.")
    })
})

app.get("/editor", (req, res) => {
    // FIXME: Very unsafe to trust user input
    let documentName = req.query.id
    if (documentName === undefined || documentName === null)
        documentName = "" + Date.now() + Math.round(Math.random() * 1E9)
    let doc = connection.get("editor", documentName)

    doc.fetch(err => {
        if (err) console.error(err)

        if (doc.type === null)
            doc.create({content: ""})
    })

    res.redirect("/?id=" + documentName)
})