const sharedb = require("sharedb/lib/client")
const StringBinding = require("sharedb-string-binding")
const ReconnectingWebSocket = require("reconnecting-websocket")
const hljs = require("highlight.js")

const socket = new ReconnectingWebSocket("ws://" + window.location.host + "/socket")
const connection = new sharedb.Connection(socket)

const md = require('markdown-it')({
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

const editor = document.getElementById("editor")
const render = document.getElementById("render")
const status = document.getElementById("status")
const buffer = document.createElement("div")

buffer.setAttribute("style", "visibility: hidden;")

document.body.appendChild(buffer)

// https://developer.mozilla.org/en-US/docs/Web/Media/Formats/Image_types
// Just use the most popular ones
const allowed_extensions = ["png", "jpg", "jpeg", "apng", "avif", "gif", "jfif", "pjpeg", "pjp", "svg", "webp"]

let md_render = _.debounce(() => {
    buffer.innerHTML = md.render(editor.value)

    window.MathJax.typesetPromise()
    setTimeout(() => { render.innerHTML = buffer.innerHTML }, 15)
}, 50)

function handle_hover(e) {
    e.preventDefault()
    e.stopPropagation()

    add_overlay()
}

function add_overlay() { editor.classList.add("file-hover") }
function remove_overlay() { editor.classList.remove("file-hover") }

function register_editor() {
    // Register the current ID of the editor if it didn't exist.
    let url = new URL(window.location.href)
    let id = url.pathname.substr(1).toLowerCase()

    if (id !== undefined && id !== null && id.trim().length !== 0) {
        let doc = connection.get("editor", id)

        doc.subscribe(err => {
            if (err) throw err

            let string_binding = new StringBinding(editor, doc, ["content"])
            string_binding.setup()
        })

        return
    }

    window.location.replace("/")
}

function insert_at_cursor(text) {
    let begin = editor.selectionStart
    let end = editor.selectionEnd

    editor.value = editor.value.substring(0, begin) + text + editor.value.substring(end)
}

function main() {
    register_editor()

    md_render()
}

let lostConnection = false
status.innerHTML = "Unconnected"

socket.addEventListener("open", () => {
    if (lostConnection) window.location.reload()

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

editor.addEventListener("input", md_render)
editor.addEventListener("dragenter", handle_hover)
editor.addEventListener("dragleave", handle_hover)
editor.addEventListener("dragover", handle_hover)

editor.addEventListener("keydown", e => {
    if (e.key === "Tab") {
        e.preventDefault()
        // let begin = editor.selectionStart
        // let end = editor.selectionEnd

        // if (begin == end)
        //     insert_at_cursor(" ".repeat(4 - (begin % 4)))
        insert_at_cursor("    ")
    }
})

let userScroll = true

function link_scroll(source, target) {
    return () => {
        if (userScroll) {
            let percentage = source.scrollTop / source.scrollHeight
            target.scrollTop = Math.round(target.scrollHeight * percentage)
    
            userScroll = false
        } else userScroll = true
    }
}

editor.addEventListener("scroll", link_scroll(editor, render))
render.addEventListener("scroll", link_scroll(render, editor))

// FIXME: Do we care about IE?
editor.addEventListener("drop", e => {
    e.preventDefault()
    e.stopPropagation()

    let transfer = e.dataTransfer
    if (transfer !== null && transfer !== undefined) {
        if (transfer.files.length === 0) return remove_overlay()

        let file = transfer.files[0]
        let file_ext = file.name.split('.').slice(-1)[0]

        if (file_ext === undefined || !allowed_extensions.includes(file_ext))
            return remove_overlay()

        let url = new URL(window.location.href).origin + "/upload"
        let data = new FormData()

        data.append("image", file) // Only upload 1 file at a time.

        fetch(url, {
            method: "POST",
            body: data
        }).then(response => {
            if (response.status === 200)
                return response.text()
            else return null
        }).then(filename => {
            if (filename == null ||
                typeof filename !== "string" ||
                filename.substr(0, 9) !== "filename:") return remove_overlay()

            insert_at_cursor("![alt text](https://storage.googleapis.com/geesen/" +
            filename.substr(9) + ")")

            editor.dispatchEvent(new Event("input"))

            md_render()
        }).catch(() => { })
    }

    remove_overlay()
})

main()