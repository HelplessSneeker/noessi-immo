#!/bin/bash
set -e

echo "Waiting for database to be ready..."
# Database healthcheck handled by Docker Compose

echo "Running database migrations..."
alembic upgrade head

if [ $? -eq 0 ]; then
    echo "✓ Migrations applied successfully"
    alembic current
else
    echo "✗ Migration failed!" >&2
    exit 1
fi

echo "Starting application..."
exec "$@"
