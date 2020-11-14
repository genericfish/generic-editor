const sharedb = require("sharedb/lib/client")
const StringBinding = require("sharedb-string-binding")

const ReconnectingWebSocket = require("reconnecting-websocket")
const socket = new ReconnectingWebSocket("ws://" + window.location.host)
const connection = new sharedb.Connection(socket)

let editor = document.getElementById("editor")
let status = document.getElementById("status")

status.innerHTML = "Unconnected"

socket.addEventListener("open", () => {
    status.innerHTML = "Connected"
})

socket.addEventListener("close", () => {
    status.innerHTML = "Disconnected"
})

socket.addEventListener("error", () => {
    status.innerHTML = "Error"
})

let doc = connection.get('test2', 'markdown');
doc.subscribe(err => {
    if (err) throw err

    let binding = new StringBinding(editor, doc, ['content'])
    binding.setup()
})