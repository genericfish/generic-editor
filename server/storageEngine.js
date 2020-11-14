const {Storage} = require("@google-cloud/storage")
const storage = new Storage()
const bucket = storage.bucket('geesen')


function getDestination (_req, _file, cb) {
    cb(null, '/dev/null')
}

function GoogleStorageEngine (opts) { }

GoogleStorageEngine.prototype._handleFile = (req, file, callback) => {
    const filename = Date.now() + '-' + Math.round(Math.random() * 1E9)
    const bucketFile = bucket.file(filename)

    file.stream.pipe(bucketFile.createWriteStream())
        .on("error", callback)
        .on("finish", () => {
            callback(null, {
                // FIXME: Actually add this information
                path: "",
                size: 0,
                gcp_name: filename
            })
        })
}

GoogleStorageEngine.prototype._removeFile = function _removeFile (_req, _file, callback) {
    // Don't actually delete anything
    callback()
}

module.exports = function (opts) {
  return new GoogleStorageEngine(opts)
}