from google.cloud import storage
import base64
import binascii

def upload_blob(type, dest, blob):
    client = storage.Client()
    bucket = client.bucket("geesen")
    blob = bucket.blob(dest)

    blob.upload_from_string(bytes.fromhex(blob), type)