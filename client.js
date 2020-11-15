const sharedb = require("sharedb/lib/client")
const StringBinding = require("sharedb-string-binding")

const ReconnectingWebSocket = require("reconnecting-websocket")
const socket = new ReconnectingWebSocket("ws://" + window.location.host + "/socket")
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

function md_render() {
    render.innerHTML = md.render(editor.value)

    window.MathJax.typesetPromise()
}

editor.addEventListener("input", md_render)

status.innerHTML = "Unconnected"
let lostConnection = false

socket.addEventListener("open", () => {
    if (lostConnection) {
        let url = new URL(window.location.href)
        let id = url.searchParams.get("id")

        if (id !== undefined && id !== null) {
            // Register current ID if not exists
            fetch(url.origin + "/editor?id=" + id).catch(err => { })
        } else {
            window.location.replace("/editor")
        }

        window.location.reload()

        lostConnection = false
    }

    status.innerHTML = "Connected"
})

socket.addEventListener("close", () => {
    status.innerHTML = "Disconnected"

    lostConnection = true
})

socket.addEventListener("error", () => {
    status.innerHTML = "Error"

    lostConnection = true
})

socket.addEventListener("message", md_render)

function main() {
    let url = new URL(window.location.href)
    let id = url.searchParams.get("id")

    if (id !== undefined && id !== null) {
        // Register current ID if not exists
        fetch(url.origin + "/editor?id=" + id).catch(err => { })
    } else {
        window.location.replace("/editor")
    }

    let doc = connection.get("editor", id)

    doc.subscribe(err => {
        if (err) throw err

        let binding = new StringBinding(editor, doc, ['content'])
        binding.setup()
    })

    md_render()
}

editor.addEventListener("dragenter", e => {
    e.preventDefault()
    e.stopPropagation()

    editor.classList.add("file-hover")
})
editor.addEventListener("dragleave", e => {
    e.preventDefault()
    e.stopPropagation()

    editor.classList.remove("file-hover")
})
editor.addEventListener("dragover", e => {
    e.preventDefault()
    e.stopPropagation()

    editor.classList.add("file-hover")
})

// FIXME: Do we care about IE?
editor.addEventListener("drop", e => {
    e.preventDefault()
    e.stopPropagation()

    let transfer = e.dataTransfer
    if (transfer !== null && transfer !== undefined) {
        let files = transfer.files
        let url = new URL(window.location.href).origin + "/upload"
        let data = new FormData()
        data.append("image", files[0]) // Only upload 1 file at a time.

        fetch(url, {
            method: "POST",
            body: data
        }).then(response => {
            return response.text()
        }).then(filename => {
            let begin = editor.selectionStart
            let end = editor.selectionEnd
            let cached = editor.value

            editor.value = cached.substring(0, begin)
            editor.value += "![alt text](https://storage.googleapis.com/geesen/" + filename + ")"
            editor.value += cached.substring(end)

            let event = new Event("input", {
                cancelable: true
            })

            editor.dispatchEvent(event)

            md_render()
        }).catch(() => { })
    }

    editor.classList.remove("file-hover")
})

main()