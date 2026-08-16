#!/usr/bin/env bash
# Ensure a web session can build, typecheck, and run the app.
set -euo pipefail
cd "$(dirname "$0")/../.."

if [ ! -d node_modules ]; then
  echo "[session-start] installing dependencies…"
  npm install --no-audit --no-fund
fi

# Prisma client is generated code; make sure it exists for typecheck/build.
if [ ! -d node_modules/.prisma/client ]; then
  echo "[session-start] generating Prisma client…"
  npx prisma generate
fi

echo "[session-start] ready. Try: npm run typecheck | npm run build | npm run story:sample"
