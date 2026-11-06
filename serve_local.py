"""Serve the standalone Mode Manette interface on this computer only."""

import argparse
import webbrowser
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parent
PUBLIC_FILES = frozenset({
    "index.html",
    "controller/controller-core.js",
    "controller/controller-diagram.svg",
    "controller/controller-layout.js",
    "controller/controller-memory.js",
    "controller/controller-test.js",
    "controller/controller-ui.js",
    "controller/controller.css",
})


class Handler(SimpleHTTPRequestHandler):
    def translate_path(self, request_path):
        path = unquote(urlsplit(request_path).path)
        resource = "index.html" if path == "/" else path.removeprefix("/")
        if resource in PUBLIC_FILES:
            return str(ROOT / resource)
        return str(ROOT / "__not_found__")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--port", type=int, default=8087)
    parser.add_argument("--open", action="store_true", help="ouvrir le navigateur")
    args = parser.parse_args()

    with ThreadingHTTPServer(("127.0.0.1", args.port), Handler) as server:
        address = f"http://127.0.0.1:{server.server_port}/"
        print(f"Mode Manette : {address} (Ctrl+C pour arreter)", flush=True)
        if args.open:
            webbrowser.open(address)
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            pass


if __name__ == "__main__":
    main()
