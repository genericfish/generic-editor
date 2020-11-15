const DB = require("sharedb").DB
const fb = require("firebase-admin")

const credentials = require('./firestore.service-account.private')

// Quick and dirty wrapper for Firestore for ShareDB
// All queries to Firestore are assumed to be successful
// there is no error handling or messages.

// Firestore document structure is based on ShareDBPostgres

// TODO: Migrate to different collection/document structure more suited for Firestore
function FirestoreDB() {
    if (!(this instanceof FirestoreDB)) return new FirestoreDB();
    DB.call(this)

    fb.initializeApp({
        credential: fb.credential.cert(credentials)
    })

    this.closed = false
}

FirestoreDB.prototype = Object.create(DB.prototype)

FirestoreDB.prototype.close = callback => {
    this.closed = true
    callback()
    // FIXME: I am firestore noob, do we or do we not close connection? If so, how?
}

FirestoreDB.prototype.query = (collection, query, fields, options, callback) => {
    // According to ShareDB MemoryDB, we dump the entire snapshots collection
    let fs_snaps = fb.firestore().collection("snapshots")
    let fs_query = fs_snaps.where("collection", "=", collection)
    fs_query.get().then(fs_snapshot => {
        callback(null, fs_snapshot.docs, null)
    })
}

FirestoreDB.prototype.commit = (collection, id, op, snapshot, _options, callback) => {
    let fs_ops = fb.firestore().collection("operations")
    let fs_snaps = fb.firestore().collection("snapshots")

    let latest = fs_ops
                .where("collection", "=", collection)
                .where("document", "=", id)
                .orderBy("version", "desc")
                .limit(1)

    function update(version) {
        // FIXME: No error checking means no version checking

        fs_ops.add({
            collection: collection,
            document: id,
            version: snapshot.v,
            op: op
        }).then(docRef => {
            if (snapshot.v == 1) {
                fs_snaps.add({
                    collection: collection,
                    document: id,
                    type: snapshot.type,
                    version: snapshot.v,
                    data: snapshot.data
                }).then(_ => {
                    // FIXME: Error checking please.
                    callback(null, true)
                })
            } else {
                let query = fs_snaps
                            .where("collection", "=", collection)
                            .where("document", "=", id)
                            .where("version", "=", snapshot.v - 1)
                query.limit(1).get().then(fs_snapshot => {
                    let doc = fs_snapshot.docs[0].data()

                    doc.ref.update({
                        type: snapshot.type,
                        version: snapshot.v,
                        data: snapshot.data
                    })

                    // FIXME: Error checking please.
                    callback(null, true)
                })
            }
        })
    }

    latest.get().then(fs_snapshot => {
        let version = fs_snapshot.empty ? 0 : fs_snapshot.docs[0].data().version

        update(version)
    })
}

FirestoreDB.prototype.getSnapshot = (collection, id, _fields, _options, callback) => {
    let fs_snaps = fb.firestore().collection("snapshots")
    let query = fs_snaps
                .where("collection", "=", collection)
                .where("document", "=", id)

    query.limit(1).get().then(fs_snapshot => {
        if (fs_snapshot.empty) {
            callback(null, new FirestoreSnapshot(
                id, 0, null, undefined, undefined
            ))
        } else {
            let doc = fs_snapshot.docs[0].data()

            callback(null, new FirestoreSnapshot(
                id, doc.version, doc.data, doc.type, undefined
            ))
        }
    })
}

FirestoreDB.prototype.getOps = (collection, id, from, to, _options, callback) => {
    let fs_ops = fb.firestore().collection("operations")
    let query = fs_ops
                .where("collection", "=", collection)
                .where("document", "=", id)
                .where("version", ">=", from)
                .where("version", "<", to)

    query.get().then(fs_snapshot => {
        callback(null, fs_snapshot.docs.map(doc => { return doc.op }))
    })
}

function FirestoreSnapshot(id, version, type, data, meta) {
    this.id = id
    this.v = version
    this.type = type
    this.data = data
    this.m = meta
}

module.exports = FirestoreDB