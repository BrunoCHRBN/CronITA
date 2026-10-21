#!/usr/bin/env bash
cd "$(dirname "$0")"
if command -v xdg-open > /dev/null; then
  (sleep 1.2 && xdg-open "http://localhost:5180") &
fi
pnpm dev --port 5180
