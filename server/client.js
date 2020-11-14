const sharedb = require("sharedb/lib/client")
const StringBinding = require("sharedb-string-binding")

const ReconnectingWebSocket = require("reconnecting-websocket")
const socket = new ReconnectingWebSocket("ws://" + window.location.host)
const connection = new sharedb.Connection(socket)

const hljs = require("highlight.js")

var md = require('markdown-it')({
    highlight: function (str, lang) {
        if (lang && hljs.getLanguage(lang)) {
            try {
            return '<pre class="hljs"><code>' +
                    hljs.highlight(lang, str, true).value +
                    '</code></pre>';
            } catch (__) {}
        }
    
        return '<pre class="hljs"><code>' + md.utils.escapeHtml(str) + '</code></pre>';
    }})

let editor = document.getElementById("editor")
let render = document.getElementById("render")
let status = document.getElementById("status")

editor.addEventListener("", () => {
    render.innerHTML = md.render(editor.value)
})

editor.addEventListener("keyup", () => {
    render.innerHTML = md.render(editor.value)

    window.MathJax.texReset(0)
    window.MathJax.typesetPromise()
})

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

function main() {
    let url = new URL(window.location.href)
    let id = url.searchParams.get("id")

    console.log(id)

    if (id === undefined || id === null) {
        window.location.replace("/editor")
    } else {
        let doc = connection.get("editor", id)

        doc.subscribe(err => {
            if (err) throw err

            let binding = new StringBinding(editor, doc, ['content'])
            binding.setup()
        })
    }
}

main()