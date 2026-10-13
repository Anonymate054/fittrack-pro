"""Servidor de desarrollo: sirve la raíz del repo sin caché e inyecta la versión de package.json."""
import http.server
import json
import os
import socketserver

PORT = 8080
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

with open(os.path.join(ROOT, "package.json"), encoding="utf-8") as f:
    APP_VERSION = "v" + json.load(f)["version"]


class NoCacheHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

    def do_GET(self):
        # Igual que scripts/build_dist.js: reemplaza __APP_VERSION__ en HTML y JS
        path = self.translate_path(self.path)
        if os.path.isdir(path):
            path = os.path.join(path, "index.html")
        if path.endswith((".html", ".js")) and os.path.isfile(path):
            with open(path, encoding="utf-8") as f:
                body = f.read().replace("__APP_VERSION__", APP_VERSION).encode("utf-8")
            content_type = "text/html" if path.endswith(".html") else "text/javascript"
            self.send_response(200)
            self.send_header("Content-Type", f"{content_type}; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return
        super().do_GET()


if __name__ == '__main__':
    socketserver.TCPServer.allow_reuse_address = True
    server = http.server.ThreadingHTTPServer(("", PORT), NoCacheHTTPRequestHandler)
    print(f"Servidor de desarrollo {APP_VERSION} sin caché en http://localhost:{PORT}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
