
const {Storage} = require("@google-cloud/server")
const storage = new Storage()
const myBucket = storage.bucket('geesen')


function getDestination (req, file, cb) {
  cb(null, '/dev/null')
}

function MyCustomStorage (opts) {
  this.getDestination = (opts.destination || getDestination)
}

MyCustomStorage.prototype._handleFile = function _handleFile (req, file, cb) {
  this.getDestination(req, file, function (err, path) {
    if (err) return cb(err)

    const bucketFile = myBucket.file('my-file')

    file.stream.pipe(bucketFile.createWriteStream())
    .on('error', cb)
    .on('finish', function () {
      cb(null, {
        path: path,
      })
    })
  })
}

MyCustomStorage.prototype._removeFile = function _removeFile (req, file, cb) {
  
}

module.exports = function (opts) {
  return new MyCustomStorage(opts)
}

