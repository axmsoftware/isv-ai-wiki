#!/usr/bin/env python3
"""Local wiki preview with Cache-Control: no-store so the browser cannot keep an old HTML shell."""
from __future__ import annotations

import os
import sys
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

ROOT = os.path.dirname(os.path.abspath(__file__))
PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 18765


class NoCacheHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def end_headers(self):
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()


if __name__ == "__main__":
    os.chdir(ROOT)
    httpd = ThreadingHTTPServer(("0.0.0.0", PORT), NoCacheHandler)
    print(f"Simulator  → http://127.0.0.1:{PORT}/village-simulator/index.html")
    print(f"Wiki shell → http://127.0.0.1:{PORT}/index.html#village-metering/village-simulator")
    print("Cache-Control: no-store")
    print("Press Ctrl+C to stop.")
    httpd.serve_forever()
