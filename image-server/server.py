from http.server import HTTPServer, BaseHTTPRequestHandler
import socketserver

PORT = 8000

class Handler(BaseHTTPRequestHandler):
    def _set_headers(self):
        self.send_response(200)
        self.send_header("Content-type", "text/html")
        self.end_headers()

    def do_HEAD(self):
        self._set_headers()

    def do_POST(self):
        self._set_headers()
        



with socketserver.TCPServer(("", PORT), Handler) as httpd:
        print("serving at port", PORT)
        httpd.serve_forever()

