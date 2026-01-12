#!/bin/bash
# Helper script for common migration tasks
# This script runs Alembic commands inside the Docker container

# Check if we're in the backend directory
if [ ! -f "docker-entrypoint.sh" ]; then
  echo "Error: Please run this script from the backend/ directory"
  exit 1
fi

# Check if backend container is running
if ! docker compose ps backend | grep -q "Up"; then
  echo "Error: Backend container is not running. Start it with: docker compose up -d"
  exit 1
fi

case "$1" in
  create)
    if [ -z "$2" ]; then
      echo "Usage: ./migrate.sh create 'migration_message'"
      exit 1
    fi
    docker compose exec backend alembic revision --autogenerate -m "$2"
    ;;
  up)
    docker compose exec backend alembic upgrade head
    ;;
  down)
    docker compose exec backend alembic downgrade -1
    ;;
  status)
    echo "Current revision:"
    docker compose exec backend alembic current
    echo ""
    echo "Migration history:"
    docker compose exec backend alembic history
    ;;
  reset)
    read -p "This will destroy all data. Are you sure? (yes/no) " -r
    echo
    if [[ $REPLY == "yes" ]]; then
      echo "Downgrading to base..."
      docker compose exec backend alembic downgrade base
      echo "Upgrading to head..."
      docker compose exec backend alembic upgrade head
      echo "Database reset complete"
    else
      echo "Reset cancelled"
    fi
    ;;
  *)
    echo "Migration helper script for immo-manager"
    echo ""
    echo "Usage: ./migrate.sh {create|up|down|status|reset} [message]"
    echo ""
    echo "Commands:"
    echo "  create 'msg'  - Create new migration with autogenerate"
    echo "  up            - Apply all pending migrations"
    echo "  down          - Rollback one migration"
    echo "  status        - Show current migration status and history"
    echo "  reset         - Reset database (WARNING: destroys all data)"
    echo ""
    echo "Examples:"
    echo "  ./migrate.sh create 'add email to property'"
    echo "  ./migrate.sh up"
    echo "  ./migrate.sh status"
    echo ""
    echo "Note: This script runs commands inside the Docker container."
    echo "      Make sure Docker containers are running first."
    exit 1
    ;;
esac
