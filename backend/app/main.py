from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from .database import engine, Base
from .routers import properties, credits, transactions, documents

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Immo Manager API",
    description="API für die Verwaltung von Eigentumswohnungen in Österreich",
    version="1.0.0"
)

# Validation error handler with user-friendly messages
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = exc.errors()

    # Create user-friendly error messages
    friendly_errors = []
    for error in errors:
        field = error.get("loc", [])[-1] if error.get("loc") else "unknown"
        error_type = error.get("type", "")

        # German field name translations
        field_translations = {
            "file": "Datei",
            "property_id": "Immobilien-ID",
            "category": "Kategorie",
            "transaction_id": "Transaktions-ID",
            "document_date": "Dokumentdatum",
            "description": "Beschreibung",
            "amount": "Betrag",
            "date": "Datum",
            "name": "Name",
        }

        field_name = field_translations.get(field, field)

        if error_type == "missing":
            friendly_errors.append(f"{field_name} ist erforderlich")
        elif error_type == "value_error":
            friendly_errors.append(f"{field_name} hat einen ungültigen Wert")
        else:
            friendly_errors.append(error.get("msg", "Validierungsfehler"))

    return JSONResponse(
        status_code=422,
        content={
            "detail": friendly_errors,
            "errors": errors  # Keep original errors for debugging
        }
    )

# CORS middleware for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(properties.router, prefix="/api")
app.include_router(credits.router, prefix="/api")
app.include_router(transactions.router, prefix="/api")
app.include_router(documents.router, prefix="/api")


@app.get("/")
def root():
    return {"message": "Immo Manager API", "docs": "/docs"}


@app.get("/health")
def health_check():
    return {"status": "healthy"}
