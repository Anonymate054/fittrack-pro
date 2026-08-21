import http.server
import socketserver

PORT = 8080

class NoCacheHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

if __name__ == '__main__':
    socketserver.TCPServer.allow_reuse_address = True
    server = http.server.ThreadingHTTPServer(("", PORT), NoCacheHTTPRequestHandler)
    print(f"Servidor HTTP Multihilo Sin Caché ejecutándose en http://localhost:{PORT}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass

