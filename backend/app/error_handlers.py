"""
Global exception handlers for FastAPI application.

These handlers provide consistent error responses with i18n support,
request ID tracking, and structured logging.
"""

import logging
from fastapi import Request, status
from fastapi.responses import JSONResponse
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from typing import Union

from .exceptions import ImmoManagerException
from .i18n.translator import translator

logger = logging.getLogger(__name__)


async def immo_manager_exception_handler(
    request: Request,
    exc: ImmoManagerException
) -> JSONResponse:
    """
    Handle custom application exceptions with i18n support.

    Translates error messages based on request locale and logs error
    with full context.
    """
    # Get request ID from middleware
    request_id = getattr(request.state, "request_id", "unknown")

    # Translate error message
    translated_message = translator.translate(exc.message, request)

    # Log error with context
    logger.error(
        f"Application error: {exc.message}",
        extra={
            "request_id": request_id,
            "status_code": exc.status_code,
            "path": request.url.path,
            "method": request.method,
            "details": exc.details,
        }
    )

    return JSONResponse(
        status_code=exc.status_code,
        content={
            "detail": translated_message,
            "request_id": request_id,
            "error_type": exc.__class__.__name__,
        }
    )


async def integrity_error_handler(
    request: Request,
    exc: IntegrityError
) -> JSONResponse:
    """
    Handle database integrity constraint violations.

    Parses the constraint type and provides user-friendly translated messages.
    """
    request_id = getattr(request.state, "request_id", "unknown")

    # Parse constraint violation type from error message
    error_message = str(exc.orig) if hasattr(exc, 'orig') else str(exc)

    # Determine user-friendly message based on constraint type
    if "foreign key" in error_message.lower():
        message = "Referenced resource does not exist"
    elif "unique" in error_message.lower():
        message = "Resource with this identifier already exists"
    elif "not null" in error_message.lower():
        message = "Required field is missing"
    else:
        message = "Database constraint violation"

    translated_message = translator.translate(message, request)

    logger.error(
        f"Database integrity error: {error_message}",
        extra={
            "request_id": request_id,
            "path": request.url.path,
            "method": request.method,
            "constraint_type": "integrity_constraint",
        }
    )

    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content={
            "detail": translated_message,
            "request_id": request_id,
            "error_type": "IntegrityError",
        }
    )


async def sqlalchemy_error_handler(
    request: Request,
    exc: SQLAlchemyError
) -> JSONResponse:
    """
    Handle general SQLAlchemy database errors.

    Catches operational errors, connection issues, and other database problems.
    """
    request_id = getattr(request.state, "request_id", "unknown")

    logger.error(
        f"Database error: {str(exc)}",
        extra={
            "request_id": request_id,
            "path": request.url.path,
            "method": request.method,
            "error_type": exc.__class__.__name__,
        }
    )

    message = translator.translate("Database operation failed", request)

    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "detail": message,
            "request_id": request_id,
            "error_type": "DatabaseError",
        }
    )


async def file_not_found_handler(
    request: Request,
    exc: FileNotFoundError
) -> JSONResponse:
    """
    Handle file system errors when files are not found.

    Used when uploaded documents are missing from disk.
    """
    request_id = getattr(request.state, "request_id", "unknown")

    logger.error(
        f"File not found: {str(exc)}",
        extra={
            "request_id": request_id,
            "path": request.url.path,
            "method": request.method,
        }
    )

    message = translator.translate("File not found on disk", request)

    return JSONResponse(
        status_code=status.HTTP_404_NOT_FOUND,
        content={
            "detail": message,
            "request_id": request_id,
            "error_type": "FileNotFoundError",
        }
    )


async def generic_exception_handler(
    request: Request,
    exc: Exception
) -> JSONResponse:
    """
    Catch-all handler for unexpected exceptions.

    Logs full exception details and returns generic 500 error to user.
    """
    request_id = getattr(request.state, "request_id", "unknown")

    logger.exception(
        f"Unexpected error: {str(exc)}",
        extra={
            "request_id": request_id,
            "path": request.url.path,
            "method": request.method,
            "error_type": exc.__class__.__name__,
        }
    )

    message = translator.translate("Internal server error", request)

    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "detail": message,
            "request_id": request_id,
            "error_type": "InternalError",
        }
    )
