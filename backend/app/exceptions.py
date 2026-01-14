"""
Custom exception classes for Immo Manager application.

These exceptions provide consistent error handling with proper status codes,
error messages, and additional details for debugging.
"""

from typing import Dict, Optional


class ImmoManagerException(Exception):
    """
    Base exception for all Immo Manager application errors.

    All custom exceptions inherit from this class to provide consistent
    structure with status_code and details.
    """

    def __init__(
        self,
        message: str,
        status_code: int = 500,
        details: Optional[Dict] = None
    ):
        self.message = message
        self.status_code = status_code
        self.details = details or {}
        super().__init__(self.message)


class ResourceNotFoundException(ImmoManagerException):
    """
    Raised when a requested resource is not found (404).

    Used for missing Properties, Credits, Transactions, or Documents.
    """

    def __init__(self, resource_type: str, resource_id: str):
        super().__init__(
            message=f"{resource_type} not found",
            status_code=404,
            details={"resource_type": resource_type, "resource_id": resource_id}
        )


class ForeignKeyConstraintException(ImmoManagerException):
    """
    Raised when attempting an operation that violates foreign key constraints (400).

    Example: Deleting a property that has child credits/transactions.
    """

    def __init__(
        self,
        message: str,
        parent_resource: str,
        child_resource: str
    ):
        super().__init__(
            message=message,
            status_code=400,
            details={"parent": parent_resource, "child": child_resource}
        )


class BusinessLogicException(ImmoManagerException):
    """
    Raised when business logic validation fails (400).

    Examples:
    - Negative amounts
    - End date before start date
    - Interest rate out of range
    """

    def __init__(self, message: str, details: Optional[Dict] = None):
        super().__init__(message=message, status_code=400, details=details)


class FileOperationException(ImmoManagerException):
    """
    Raised when file system operations fail (500).

    Examples:
    - Failed to save uploaded file
    - Failed to read file from disk
    - Directory creation failed
    """

    def __init__(self, message: str, filepath: Optional[str] = None):
        super().__init__(
            message=message,
            status_code=500,
            details={"filepath": filepath} if filepath else {}
        )


class DatabaseException(ImmoManagerException):
    """
    Raised when database operations fail (500).

    Examples:
    - Failed to create/update/delete record
    - Database connection errors
    - Transaction failures
    """

    def __init__(self, message: str, operation: Optional[str] = None):
        super().__init__(
            message=message,
            status_code=500,
            details={"operation": operation} if operation else {}
        )
