#!/bin/sh
set -e

if [ -n "$DATABASE_URL" ]; then
  echo "Running Prisma schema sync..."
  npx prisma db push --skip-generate || echo "Warning: prisma db push failed, continuing..."
else
  echo "DATABASE_URL not set, skipping Prisma schema sync..."
fi

echo "Starting Next.js..."
if [ -f server.js ]; then
  exec node server.js
fi

if [ -f .next/standalone/server.js ]; then
  exec node .next/standalone/server.js
fi

exec npm start
