# generic editor

The generic editor is a way for people to collaborate over a document, exchange ideas, and write notes using markdown.

### Features
- Drag and drop file upload
- Syntax highlighting
![demo screenshot](pictures/Syntax.png)
- LaTeX support
![demo screenshot](pictures/LaTeX.png)

### What we used
- [node.js](http://nodejs.org) is a major component in implementing generic editor, from the hosting the static files to running the collaborative service.
- The website for [generic editor](http://aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.tech/) is hosted on a Google Cloud Compute Engine that hosts our nginx server which acts as a reverse proxy for our express webapp and our WebSocket server.
- Using [multer](https://github.com/expressjs/multer) we created an ingest server for images that were uploaded using the drag and drop functionality.
    - This was done by creating a custom storage engine for multer that used the [@google-cloud/storage](https://github.com/googleapis/nodejs-storage) package to upload binary data to our Google Cloud Storage Bucket.
- Allowing users to collaborate on the same document was achieved using an operational transformation algorithm implemented by [ShareDB](https://github.com/share/sharedb).
- Through WebSockets we were able to sync operations between a central server and multiple clients.
- Finally, the markdown editor uses [MathJax](https://www.mathjax.org/) to render LaTeX, and [markdown-it](https://github.com/markdown-it/markdown-it) to render the markdown.

### What's next

We hope to more closely integrate our platform with Google Cloud, namely writing a database wrapper for ShareDB that interfaces with Google Firestore. This will allow us achieve our goal of moving our entire stack onto the free tier for the Google Cloud Platform.

### Demo

Warning: The demo is **NOT MODERATED**.

[Demo Link](http://aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.tech/?id=demo)
