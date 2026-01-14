from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
import logging
import sys

from .database import get_db
from .routers import properties, credits, transactions, documents
from .i18n.translator import translator
from .middleware import RequestLoggingMiddleware
from .error_handlers import (
    immo_manager_exception_handler,
    integrity_error_handler,
    sqlalchemy_error_handler,
    file_not_found_handler,
    generic_exception_handler,
)
from .exceptions import ImmoManagerException


# Configure structured logging
def configure_logging():
    """Configure structured logging for the application"""
    formatter = logging.Formatter(
        fmt='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )

    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(formatter)

    root_logger = logging.getLogger()
    root_logger.setLevel(logging.INFO)
    root_logger.addHandler(console_handler)

    # Configure app logger
    app_logger = logging.getLogger("app")
    app_logger.setLevel(logging.INFO)

    # Reduce noise from third-party libraries
    logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)


# Initialize logging
configure_logging()

app = FastAPI(
    title="Immo Manager API",
    description="API for managing condominiums in Austria",
    version="1.0.0"
)

# Register global exception handlers (specific to general order)
app.add_exception_handler(ImmoManagerException, immo_manager_exception_handler)
app.add_exception_handler(IntegrityError, integrity_error_handler)
app.add_exception_handler(SQLAlchemyError, sqlalchemy_error_handler)
app.add_exception_handler(FileNotFoundError, file_not_found_handler)
app.add_exception_handler(Exception, generic_exception_handler)

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

# Add request logging middleware FIRST (so it wraps everything)
app.add_middleware(RequestLoggingMiddleware)

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
