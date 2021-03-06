const http = require("http")
const express = require("express")
const ShareDB = require("sharedb")
const WebSocket = require("ws")
const WebSocketJSONStream = require("@teamwork/websocket-json-stream")
const multer = require("multer")
const randomwords = require("random-words")
const path = require("path")

const GoogleStorageEngine = require('./storage_engine')

const upload = multer({
    storage: GoogleStorageEngine(),
    limits: {
        fieldSize: 2048,
        fileSize: 1E7
    }
})

let share

if (process.env.NODE_ENV == "dev") {
    share = new ShareDB({db: new ShareDB.MemoryDB()})
} else {
    const db = require("sharedb-mongo")("mongodb://127.0.0.1:27017/document",
        { useUnifiedTopology: true })

    share = new ShareDB({db})
}

let connection = share.connect()

let app = express();
let server = http.createServer(app)
let wss = new WebSocket.Server({server: server})

server.listen(8248)

wss.on('connection', (ws) => { share.listen(new WebSocketJSONStream(ws)) })

app.use(express.static('static'))

app.post("/upload", (req, res) => {
    upload.single("image")(req, res, err => {
        if (err) console.error("Error while uploading file.")
    })
})

app.get("/:editorID", (req, res, next) => {
    let documentName = req.params["editorID"]

    let doc = connection.get("editor", documentName.toLowerCase())

    doc.fetch(err => {
        if (err) return console.error("[EDITOR] Error: " + err)

        // REVIEW: Should we allow the user to specify their own document name?
        // Currently if a user specified name does not exist then we make one dynamically
        if (doc.type === null) {
            res.redirect(301, "/")

            return next()
        } else {
            let options = {
                root: path.join(process.cwd(), "static")
            }
        
            res.sendFile("/client.html", options, err => {
                if (err) return next(err)
            })
        }
    })
})

app.get("/", (req, res, next) => {
    // For legacy support, originally editor IDs were URL params not express
    if (req.query.id !== undefined) {
        res.redirect(301, "/" + req.query.id)
    } else {
        updateDocument()
    }

    function updateDocument() {
        let documentName = randomwords({
            exactly: 3,
            join: '',
            formatter: (word) => {
                return word.charAt(0).toUpperCase() + word.substr(1)
            }
        })

        let doc = connection.get("editor", documentName.toLowerCase())

        doc.fetch(err => {
            if (err) return console.error("[EDITOR] Error: " + err)

            if (doc.type === null) {
                doc.create({content: ""})

                res.redirect("/" + documentName)

                console.log(`[SERVER] Created new document: "${documentName}"`)
            } else {
                updateDocument()
            }
        })
    }
})