# Backend — Technical Setup

FastAPI REST API with PostgreSQL and SQLAlchemy ORM.

## Prerequisites

- Python 3.11+
- PostgreSQL 15+ (or use Docker Compose)

## Installation

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

## Environment Configuration

Set `DATABASE_URL` environment variable:

```bash
export DATABASE_URL=postgresql://immo:immo_secret@localhost:5432/immo_manager
```

Default (Docker): `postgresql://immo:immo_secret@db:5432/immo_manager`

## Development

```bash
# Start with auto-reload
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Interactive API docs
# http://localhost:8000/docs
```

## Dependencies

**Core:**
- `fastapi` 0.115 — Web framework
- `uvicorn` 0.32 — ASGI server
- `sqlalchemy` 2.0 — ORM
- `psycopg2-binary` 2.9 — PostgreSQL adapter

**Data Validation:**
- `pydantic` 2.10 — Schema validation

**File Handling:**
- `python-multipart` 0.0.17 — File upload support

## Database

**Connection Pool:**
- SQLAlchemy engine with default pool settings
- Session lifecycle: request-scoped via `Depends(get_db)`

**Migrations:**
- Not implemented (manual SQL or add Alembic)

**Schema Creation:**
```python
from app.database import engine
from app.models import Base

Base.metadata.create_all(bind=engine)
```

## File Storage

Documents stored at: `/app/documents/{property_id}/{uuid}{ext}`

- Configurable via `UPLOAD_DIR` in `routers/documents.py`
- Files persist outside Docker container via volume mount

## API Conventions

- Base path: `/api/`
- Response format: JSON
- UUIDs as primary keys (PostgreSQL `uuid` type)
- Decimal types for currency (`NUMERIC(10,2)`)
- German enum values (e.g., `"miete"`, `"reparatur"`)

## CORS

Configured for frontend origin:
```python
origins = ["http://localhost:3000"]
```

Update in `app/main.py` for production.

## Error Handling

```python
from fastapi import HTTPException

raise HTTPException(status_code=404, detail="Nicht gefunden")
raise HTTPException(status_code=400, detail="Ungültige Eingabe")
```

## Testing

Not implemented. Add `pytest` and `httpx` for async tests.

## Production

```bash
# Use Gunicorn with Uvicorn workers
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker
```

## Docker

```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```
