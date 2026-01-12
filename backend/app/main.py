from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from .database import get_db
from .routers import properties, credits, transactions, documents
from .i18n.translator import translator

app = FastAPI(
    title="Immo Manager API",
    description="API for managing condominiums in Austria",
    version="1.0.0"
)

# Validation error handler with user-friendly localized messages
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = exc.errors()
    locale = translator.get_locale(request)

    # Create user-friendly error messages
    friendly_errors = []
    for error in errors:
        field = error.get("loc", [])[-1] if error.get("loc") else "unknown"
        error_type = error.get("type", "")

        # Translate field name
        field_name = translator.translate(field, request)

        if error_type == "missing":
            friendly_errors.append(translator.translate("{} is required", request).format(field_name))
        elif error_type == "value_error":
            friendly_errors.append(translator.translate("{} has an invalid value", request).format(field_name))
        else:
            friendly_errors.append(translator.translate(error.get("msg", "Validation error"), request))

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
