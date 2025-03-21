#!/bin/sh

# Create .env.local if not exists
if [ ! -f .env.local ]; then
  echo "Creating .env.local file..."
  echo "JWT_SECRET=\"$(head -c 32 /dev/urandom | base64)\"" > .env.local
fi

# Run migrations and start server
npx prisma migrate deploy
exec node server.js
