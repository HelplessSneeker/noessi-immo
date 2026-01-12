# Database Migrations

This project uses Alembic for database schema versioning and migrations.

## Overview

- **Migration Directory**: `backend/migrations/`
- **Configuration**: `backend/alembic.ini`
- **Versions**: `backend/migrations/versions/`

Migrations run automatically when the backend Docker container starts, ensuring the database schema is always up-to-date.

## Common Commands

### Creating a New Migration

When you modify models in `app/models.py`:

```bash
# Autogenerate migration from model changes
alembic revision --autogenerate -m "description_of_changes"

# Example: Adding a new field
alembic revision --autogenerate -m "add_email_to_property"
```

**Important**: Always review the generated migration file before applying it. Alembic's autogenerate is smart but not perfect, especially with:
- PostgreSQL enum changes
- Column type modifications
- Complex data migrations

### Applying Migrations

```bash
# Upgrade to latest version
alembic upgrade head

# Upgrade by one revision
alembic upgrade +1

# Upgrade to specific revision
alembic upgrade <revision_id>
```

### Checking Status

```bash
# Show current revision
alembic current

# Show migration history
alembic history

# Show migration history with details
alembic history --verbose

# Show pending migrations
alembic show head
```

### Rollback

```bash
# Downgrade by one revision
alembic downgrade -1

# Downgrade to specific revision
alembic downgrade <revision_id>

# Downgrade all (WARNING: destroys all data)
alembic downgrade base
```

### Manual Migrations

For complex changes that autogenerate can't handle:

```bash
# Create empty migration
alembic revision -m "complex_data_migration"

# Edit the generated file in migrations/versions/
# Add custom upgrade() and downgrade() logic
```

## Docker Workflow

Migrations run automatically when the backend container starts via the `docker-entrypoint.sh` script.

### Viewing Migration Status

```bash
# Check current migration version
docker compose exec backend alembic current

# View migration history
docker compose exec backend alembic history

# View backend logs to see migration output
docker compose logs backend
```

### Applying New Migrations

```bash
# Method 1: Restart backend (recommended)
docker compose restart backend

# Method 2: Run manually in container
docker compose exec backend alembic upgrade head

# Method 3: Rebuild (for significant changes)
docker compose up --build backend
```

### Creating Migrations in Docker

```bash
# Generate migration inside container
docker compose exec backend alembic revision --autogenerate -m "description"

# The migration file will appear in backend/migrations/versions/
# Review it, then restart to apply
docker compose restart backend
```

## Local Development Workflow

### Option 1: Using Docker (Recommended)

Since the database runs in Docker, the easiest way is to use the helper script:

1. Make changes to models in `app/models.py`
2. Generate migration: `./migrate.sh create "description"`
3. Review the generated migration file in `migrations/versions/`
4. Apply migration: `./migrate.sh up` (or just restart: `docker compose restart backend`)
5. Verify changes: `./migrate.sh status`
6. Commit both the model changes and migration file to git

The `migrate.sh` script automatically runs commands inside the Docker container.

### Option 2: Direct Alembic Commands (Advanced)

If you prefer running Alembic commands directly:

```bash
# All commands run inside Docker container
docker compose exec backend alembic revision --autogenerate -m "description"
docker compose exec backend alembic upgrade head
docker compose exec backend alembic current
```

### Option 3: Local PostgreSQL (Not Recommended)

If you have PostgreSQL running locally on your machine:

1. Set `DATABASE_URL` environment variable:
   ```bash
   export DATABASE_URL="postgresql+psycopg://immo:immo_secret@localhost:5432/immo_manager"
   ```
2. Run Alembic commands directly:
   ```bash
   alembic revision --autogenerate -m "description"
   alembic upgrade head
   ```

**Note**: Most users should use Option 1 (helper script) as it works seamlessly with Docker.

## Troubleshooting

### "Connection refused" or "OperationalError"

This means Alembic can't connect to the database. Common causes:

**Running locally but database is in Docker:**
```bash
# Solution: Use the helper script or docker compose exec
./migrate.sh status
# OR
docker compose exec backend alembic current
```

**Docker containers not running:**
```bash
# Check if containers are up
docker compose ps

# Start containers
docker compose up -d
```

### "No module named 'app'"

The migration can't import your models. Ensure you're running from the `backend/` directory:
```bash
cd backend
./migrate.sh status
```

### "Target database is not up to date"

Apply pending migrations:
```bash
alembic upgrade head
```

### "Can't locate revision identified by X"

Migration files are missing. Ensure all migration files are present in `migrations/versions/` and committed to git.

### Migration fails with enum error

PostgreSQL enums require special handling. You may need to manually edit the migration:

```python
# Adding a new enum value
def upgrade():
    op.execute("ALTER TYPE transactioncategory ADD VALUE 'insurance'")

def downgrade():
    # Cannot remove enum values in PostgreSQL
    raise NotImplementedError("Cannot remove enum values")
```

### Reset database (development only)

```bash
# Drop all tables and recreate
alembic downgrade base
alembic upgrade head

# Or with Docker
docker compose down -v  # Removes volumes
docker compose up --build
```

### Autogenerate detected no changes but I modified models

Common causes:
- Database already has the changes (check with `\d tablename` in psql)
- Models weren't imported in `migrations/env.py`
- Running from wrong directory

## Best Practices

1. **Always review autogenerated migrations** - Alembic may miss complex changes or generate incorrect code for enums
2. **Test migrations in both directions** - Ensure both `upgrade()` and `downgrade()` work correctly
3. **One logical change per migration** - Makes debugging and rollback easier
4. **Never edit applied migrations** - Create a new migration to fix issues instead
5. **Keep migration files in version control** - Essential for team coordination
6. **Add data migrations when needed** - Schema changes may require data updates
7. **Use descriptive migration messages** - Makes history easier to understand
8. **Test on a copy of production data** - Before applying migrations to production

## Common Migration Scenarios

### Adding a New Field

```python
# After adding field to model
alembic revision --autogenerate -m "add_email_to_property"

# Generated migration:
def upgrade():
    op.add_column('properties', sa.Column('email', sa.String(length=255), nullable=True))

def downgrade():
    op.drop_column('properties', 'email')
```

### Modifying Enum Values

```python
# Cannot use autogenerate - must write manually
alembic revision -m "add_insurance_category"

def upgrade():
    op.execute("ALTER TYPE transactioncategory ADD VALUE 'insurance'")

def downgrade():
    # PostgreSQL doesn't support removing enum values
    raise NotImplementedError("Cannot remove enum values from PostgreSQL")
```

### Data Migration

```python
# Populate a new field based on existing data
def upgrade():
    # Add column
    op.add_column('properties', sa.Column('full_address', sa.String(500), nullable=True))

    # Migrate data
    connection = op.get_bind()
    connection.execute(
        text("UPDATE properties SET full_address = name || ', ' || address")
    )

    # Make non-nullable after data migration
    op.alter_column('properties', 'full_address', nullable=False)
```

### Renaming a Column

```python
def upgrade():
    op.alter_column('properties', 'old_name', new_column_name='new_name')

def downgrade():
    op.alter_column('properties', 'new_name', new_column_name='old_name')
```

## Migration File Structure

```python
"""description

Revision ID: abc123
Revises: xyz789
Create Date: 2026-01-12 20:14:49.423460+00:00
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers
revision = 'abc123'
down_revision = 'xyz789'  # Previous migration
branch_labels = None
depends_on = None

def upgrade() -> None:
    # Forward migration logic
    pass

def downgrade() -> None:
    # Rollback logic
    pass
```

## Environment Variables

- `DATABASE_URL` - PostgreSQL connection string
  - Docker: `postgresql+psycopg://immo:immo_secret@db:5432/immo_manager`
  - Local: `postgresql+psycopg://immo:immo_secret@localhost:5432/immo_manager`

## Additional Resources

- [Alembic Documentation](https://alembic.sqlalchemy.org/)
- [SQLAlchemy Documentation](https://docs.sqlalchemy.org/)
- [PostgreSQL ALTER TYPE](https://www.postgresql.org/docs/current/sql-altertype.html)
