#!/bin/bash
cd "$(dirname "$0")/www" || exit 1
PORT=8080
open "http://localhost:${PORT}/index.html"
python3 -m http.server "$PORT"
