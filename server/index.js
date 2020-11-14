const http = require("http")
const express = require("express")
const ShareDB = require("sharedb")
const ShareDBMongo = require("sharedb-mingo-memory")
const WebSocket = require("ws")
const WebSocketJSONStream = require("@teamwork/websocket-json-stream")

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