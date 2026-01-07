# Backend — FastAPI

Python-Backend für die Immo Manager API.

## Struktur

```
backend/
├── app/
│   ├── main.py           # FastAPI App, CORS, Router-Einbindung
│   ├── database.py       # PostgreSQL Connection, SessionLocal, get_db()
│   ├── models.py         # SQLAlchemy ORM Models
│   ├── schemas.py        # Pydantic Request/Response Schemas
│   └── routers/
│       ├── properties.py
│       ├── credits.py
│       ├── transactions.py
│       └── documents.py
├── requirements.txt
└── Dockerfile
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

### File Upload

Dokumente werden unter `/app/documents/{property_id}/` gespeichert. Unique Filename via UUID:
```python
unique_filename = f"{uuid4()}{file_ext}"
filepath = os.path.join(UPLOAD_DIR, str(property_id), unique_filename)
```

**Fehlerbehandlung:** HTTPException mit status_code und detail für Client-Fehler:
```python
from fastapi import HTTPException

raise HTTPException(status_code=404, detail="Resource nicht gefunden")
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
