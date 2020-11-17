const http = require("http")
const express = require("express")
const ShareDB = require("sharedb")
const ShareDBMongo = require("sharedb-mingo-memory")
const WebSocket = require("ws")
const WebSocketJSONStream = require("@teamwork/websocket-json-stream")
const multer = require("multer")
const randomwords = require("random-words")

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

app.post("/upload", (req, res) => {
    upload.single("image")(req, res, err => {
        if (err) console.error("Error while uploading file.")
    })
})

app.get("/editor", (req, res) => {
    // FIXME: Very unsafe to trust user input
    let documentName = req.query.id
    let wantNew = documentName === undefined || documentName === null

    function updateDocument() {
        if (wantNew)
            documentName = randomwords({
                exactly: 3,
                join: '',
                formatter: (word) => {
                    return word.charAt(0).toUpperCase() + word.substr(1)
                }
            })

        let doc = connection.get("editor", documentName)

        doc.fetch(err => {
            if (err) return console.error("[EDITOR] Error: " + err)

            if (doc.type === null) {
                doc.create({content: ""})
            } else if (wantNew) {
                return updateDocument()
            }

            res.redirect("/?id=" + documentName)
        })
    }

    updateDocument()
})