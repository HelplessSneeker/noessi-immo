# Backend — FastAPI

Python-Backend für die Immo Manager API.

## Struktur

```
backend/
├── app/
│   ├── main.py           # FastAPI App, CORS, Exception Handlers, Logging
│   ├── database.py       # PostgreSQL Connection mit Auto-Rollback
│   ├── models.py         # SQLAlchemy ORM Models
│   ├── schemas.py        # Pydantic Request/Response Schemas
│   ├── exceptions.py     # Custom Exception Classes
│   ├── error_handlers.py # Global Exception Handlers
│   ├── middleware.py     # Request Logging & ID Tracking
│   ├── i18n/
│   │   └── translator.py # i18n Translator für API-Responses & Errors
│   └── routers/
│       ├── properties.py
│       ├── credits.py
│       ├── transactions.py
│       └── documents.py
├── migrations/           # Alembic Migration Files
├── alembic.ini
├── migrate.sh
├── docker-entrypoint.sh
└── requirements.txt
```

## Konventionen

### Neuen Router erstellen

1. Datei in `app/routers/` anlegen
2. Router mit Prefix und Tags definieren:
   ```python
   router = APIRouter(prefix="/neue-resource", tags=["Neue Resource"])
   ```
3. In `app/main.py` importieren und einbinden:
   ```python
   from .routers import neue_resource
   app.include_router(neue_resource.router, prefix="/api")
   ```

### Neues Model erstellen

1. SQLAlchemy Model in `app/models.py`:
   ```python
   class NeuesModel(Base):
       __tablename__ = "neue_tabelle"
       id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
       # ... weitere Felder
   ```

2. Pydantic Schemas in `app/schemas.py`:
   ```python
   class NeuesModelBase(BaseModel):
       feld: str

   class NeuesModelCreate(NeuesModelBase):
       pass

   class NeuesModelResponse(NeuesModelBase):
       id: UUID
       model_config = ConfigDict(from_attributes=True)
   ```

3. Migration erstellen:
   ```bash
   ./migrate.sh create "add neue_tabelle"
   # Migration wird automatisch beim Container-Start angewendet
   ```

### Database Migrations

Alembic verwaltet Schema-Änderungen. Siehe `MIGRATIONS.md` für Details.

**Quick Start:**
- Nach Model-Änderung: `./migrate.sh create "beschreibung"`
- Migration prüfen: `./migrate.sh status`
- Migrations laufen automatisch beim Backend-Start

### Dependency Injection

Database Session wird via Dependency injiziert:
```python
from ..database import get_db

@router.get("/")
def get_items(db: Session = Depends(get_db)):
    return db.query(Model).all()
```

## Wichtige Patterns

### Berechnete Felder

Felder wie `current_balance` bei Credits werden nicht in der DB gespeichert, sondern bei Abfrage berechnet:
```python
def calculate_current_balance(db: Session, credit: Credit) -> Decimal:
    payments = db.query(func.coalesce(func.sum(Transaction.amount), 0)).filter(
        Transaction.credit_id == credit.id
    ).scalar()
    return credit.original_amount - payments
```

### Fehlerbehandlung (Error Handling)

Umfassende Fehlerbehandlung mit Custom Exceptions, globalen Handlers und i18n-Support.

**Standard-Pattern für neue Endpoints:**
```python
from fastapi import Request
from sqlalchemy.exc import SQLAlchemyError
from ..exceptions import ResourceNotFoundException, BusinessLogicException, DatabaseException
from ..i18n.translator import translator

@router.post("/", response_model=ResponseSchema, status_code=201)
def create_resource(
    data: CreateSchema,
    request: Request,  # Für i18n
    db: Session = Depends(get_db)
):
    # 1. Foreign Key Validation
    parent = db.query(Parent).filter(Parent.id == data.parent_id).first()
    if not parent:
        raise ResourceNotFoundException("Parent", str(data.parent_id))

    # 2. Business Logic Validation
    if data.amount <= 0:
        raise BusinessLogicException(
            translator.translate("Amount must be positive", request)
        )

    # 3. Database Operation mit Error Handling
    try:
        resource = Resource(**data.model_dump())
        db.add(resource)
        db.commit()
        db.refresh(resource)
        return resource
    except SQLAlchemyError:
        db.rollback()
        raise DatabaseException("Failed to create resource", operation="create")
```

**Custom Exceptions:**
- `ResourceNotFoundException(resource_type, resource_id)` → 404
- `BusinessLogicException(message, details=None)` → 400
- `ForeignKeyConstraintException(message, parent, child)` → 400
- `FileOperationException(message, filepath=None)` → 500
- `DatabaseException(message, operation=None)` → 500

**Neue Übersetzungen hinzufügen:**
In `app/i18n/translator.py` in beiden Dictionaries (`de` und `en`):
```python
"Your error message": "Deine Fehlermeldung",  # de
"Your error message": "Your error message",   # en
```

**Error Response Format:**
```json
{
  "detail": "Translated error message",
  "request_id": "uuid-for-tracking",
  "error_type": "BusinessLogicException"
}
```

**Request ID Tracking:**
Jede Response enthält `X-Request-ID` Header für Debugging. Request IDs erscheinen in Logs.

**Implementierte Validierungen:**
- **Properties:** purchase_price ≥ 0, Löschung nur ohne child resources
- **Credits:** original_amount > 0, interest_rate 0-100, monthly_payment ≤ original_amount, end_date > start_date, start_date nicht in Zukunft
- **Transactions:** amount > 0, date max 1 Jahr in Zukunft, credit muss zur gleichen property gehören, category/type Kompatibilität
- **Documents:** Dateigrößen max 50MB, nur erlaubte Dateitypen, mutual exclusivity (transaction XOR credit)

### File Upload

Dokumente mit Validierung unter `/app/documents/{property_id}/`:
```python
# Konstanten in documents.py
MAX_FILE_SIZE_MB = 50
ALLOWED_EXTENSIONS = {'.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx', '.xls', '.xlsx', '.txt'}

# File Extension Validation
file_ext = os.path.splitext(file.filename)[1].lower()
if file_ext not in ALLOWED_EXTENSIONS:
    raise BusinessLogicException(
        translator.translate("File type not allowed", request),
        details={"allowed_types": list(ALLOWED_EXTENSIONS)}
    )
```

## Environment Variables

- `DATABASE_URL` — PostgreSQL Connection String (default: `postgresql://immo:immo_secret@db:5432/immo_manager`)

## Commands

```bash
# Lokal starten (mit aktiviertem venv)
uvicorn app.main:app --reload

# Dependencies installieren
pip install -r requirements.txt

# Neues Package hinzufügen
pip install <package> && pip freeze > requirements.txt
```

## Code Style

- Type Hints verwenden
- Docstrings für komplexe Funktionen
- Async nur wenn nötig (File I/O)
- Deutsche Enum-Werte, englischer Code
