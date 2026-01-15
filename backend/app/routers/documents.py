from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    UploadFile,
    File,
    Form,
    Query,
    Request,
)
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from typing import List, Optional
from uuid import UUID, uuid4
from datetime import date
import os
import aiofiles

from ..database import get_db
from ..models import Document, DocumentCategory, Property, Transaction, Credit
from ..schemas import DocumentResponse
from ..i18n.translator import translator
from ..exceptions import (
    ResourceNotFoundException,
    BusinessLogicException,
    FileOperationException,
    DatabaseException,
)

router = APIRouter(prefix="/documents", tags=["Documents"])

# Use environment variable or default to local path for development
UPLOAD_DIR = os.getenv("UPLOAD_DIR", os.path.join(os.getcwd(), "documents"))

# File validation constants
MAX_FILE_SIZE_MB = 50
ALLOWED_EXTENSIONS = {
    ".pdf",
    ".jpg",
    ".jpeg",
    ".png",
    ".doc",
    ".docx",
    ".xls",
    ".xlsx",
    ".txt",
    ".md",
}


@router.get("/", response_model=List[DocumentResponse])
def get_documents(
    property_id: Optional[UUID] = None,
    transaction_id: Optional[UUID] = None,
    credit_id: Optional[UUID] = None,
    category: Optional[DocumentCategory] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
):
    query = db.query(Document)

    if property_id:
        query = query.filter(Document.property_id == property_id)
    if transaction_id:
        query = query.filter(Document.transaction_id == transaction_id)
    if credit_id:
        query = query.filter(Document.credit_id == credit_id)
    if category:
        query = query.filter(Document.category == category)

    return query.order_by(Document.upload_date.desc()).offset(skip).limit(limit).all()


@router.get("/{document_id}", response_model=DocumentResponse)
def get_document(document_id: UUID, request: Request, db: Session = Depends(get_db)):
    document = db.query(Document).filter(Document.id == document_id).first()
    if not document:
        raise ResourceNotFoundException("Document", str(document_id))
    return document


@router.get("/{document_id}/download")
def download_document(
    document_id: UUID, request: Request, db: Session = Depends(get_db)
):
    document = db.query(Document).filter(Document.id == document_id).first()
    if not document:
        raise ResourceNotFoundException("Document", str(document_id))

    if not os.path.exists(document.filepath):
        raise FileOperationException(
            translator.translate("File not found on disk", request),
            filepath=document.filepath,
        )

    return FileResponse(
        path=document.filepath,
        filename=document.filename,
        media_type="application/octet-stream",
    )


@router.post("/", response_model=DocumentResponse, status_code=201)
async def upload_document(
    request: Request,
    file: UploadFile = File(...),
    property_id: UUID = Form(...),
    category: DocumentCategory = Form(...),
    transaction_id: Optional[UUID] = Form(None),
    credit_id: Optional[UUID] = Form(None),
    document_date: Optional[date] = Form(None),
    description: Optional[str] = Form(None),
    db: Session = Depends(get_db),
):
    # Validate file
    if not file.filename:
        raise BusinessLogicException(translator.translate("No file selected", request))

    # File extension validation
    file_ext = os.path.splitext(file.filename)[1].lower()
    if file_ext not in ALLOWED_EXTENSIONS:
        raise BusinessLogicException(
            translator.translate("File type not allowed", request),
            details={"allowed_types": list(ALLOWED_EXTENSIONS)},
        )

    # Validate property exists
    property = db.query(Property).filter(Property.id == property_id).first()
    if not property:
        raise ResourceNotFoundException("Property", str(property_id))

    # Validate transaction exists if provided
    if transaction_id:
        transaction = (
            db.query(Transaction).filter(Transaction.id == transaction_id).first()
        )
        if not transaction:
            raise ResourceNotFoundException("Transaction", str(transaction_id))
        if transaction.property_id != property_id:
            raise BusinessLogicException(
                translator.translate(
                    "Transaction must belong to the same property", request
                )
            )

    # Validate credit exists if provided
    if credit_id:
        credit = db.query(Credit).filter(Credit.id == credit_id).first()
        if not credit:
            raise ResourceNotFoundException("Credit", str(credit_id))
        if credit.property_id != property_id:
            raise BusinessLogicException(
                translator.translate("Credit must belong to the same property", request)
            )

    # Validate mutual exclusivity
    if transaction_id and credit_id:
        raise BusinessLogicException(
            translator.translate(
                "Document cannot be linked to both transaction and credit", request
            )
        )

    # Convert category string to enum
    try:
        category_enum = DocumentCategory(category)
    except ValueError:
        raise BusinessLogicException(f"Invalid category: {category}")

    # Read file content
    try:
        content = await file.read()
    except Exception:
        raise FileOperationException(
            translator.translate("Failed to read uploaded file", request)
        )

    # File size validation
    file_size_mb = len(content) / (1024 * 1024)
    if file_size_mb > MAX_FILE_SIZE_MB:
        raise BusinessLogicException(
            translator.translate("File size exceeds maximum allowed size", request),
            details={
                "max_size_mb": MAX_FILE_SIZE_MB,
                "file_size_mb": round(file_size_mb, 2),
            },
        )

    # Generate unique filename
    unique_filename = f"{uuid4()}{file_ext}"
    filepath = os.path.join(UPLOAD_DIR, str(property_id), unique_filename)

    # Ensure directory exists and save file
    try:
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        async with aiofiles.open(filepath, "wb") as out_file:
            await out_file.write(content)
    except OSError:
        raise FileOperationException(
            translator.translate("Failed to save file to disk", request),
            filepath=filepath,
        )

    # Create database record
    try:
        document = Document(
            property_id=property_id,
            transaction_id=transaction_id,
            credit_id=credit_id,
            filename=file.filename,
            filepath=filepath,
            document_date=document_date,
            category=category_enum.value,
            description=description,
        )

        db.add(document)
        db.commit()
        db.refresh(document)
        return document
    except SQLAlchemyError:
        # Cleanup uploaded file if database operation fails
        if os.path.exists(filepath):
            try:
                os.remove(filepath)
            except OSError:
                pass
        db.rollback()
        raise DatabaseException("Failed to create document record", operation="create")


@router.put("/{document_id}", response_model=DocumentResponse)
def update_document(
    document_id: UUID,
    request: Request,
    category: Optional[str] = Form(None),
    transaction_id: Optional[UUID] = Form(None),
    credit_id: Optional[UUID] = Form(None),
    document_date: Optional[date] = Form(None),
    description: Optional[str] = Form(None),
    db: Session = Depends(get_db),
):
    document = db.query(Document).filter(Document.id == document_id).first()
    if not document:
        raise ResourceNotFoundException("Document", str(document_id))

    # Validate transaction exists if provided
    if transaction_id:
        transaction = (
            db.query(Transaction).filter(Transaction.id == transaction_id).first()
        )
        if not transaction:
            raise ResourceNotFoundException("Transaction", str(transaction_id))
        if transaction.property_id != document.property_id:
            raise BusinessLogicException(
                translator.translate(
                    "Transaction must belong to the same property", request
                )
            )

    # Validate credit exists if provided
    if credit_id:
        credit = db.query(Credit).filter(Credit.id == credit_id).first()
        if not credit:
            raise ResourceNotFoundException("Credit", str(credit_id))
        if credit.property_id != document.property_id:
            raise BusinessLogicException(
                translator.translate("Credit must belong to the same property", request)
            )

    # Validate mutual exclusivity if both are being set
    updated_transaction_id = (
        transaction_id if transaction_id is not None else document.transaction_id
    )
    updated_credit_id = credit_id if credit_id is not None else document.credit_id

    if updated_transaction_id is not None and updated_credit_id is not None:
        raise BusinessLogicException(
            translator.translate(
                "Document cannot be linked to both transaction and credit", request
            )
        )

    if category is not None:
        try:
            category_enum = DocumentCategory(category)
            document.category = category_enum.value
        except ValueError:
            raise BusinessLogicException(f"Invalid category: {category}")
    if transaction_id is not None:
        document.transaction_id = transaction_id
    if credit_id is not None:
        document.credit_id = credit_id
    if document_date is not None:
        document.document_date = document_date
    if description is not None:
        document.description = description

    try:
        db.commit()
        db.refresh(document)
        return document
    except SQLAlchemyError:
        db.rollback()
        raise DatabaseException("Failed to update document", operation="update")


@router.delete("/{document_id}", status_code=204)
def delete_document(document_id: UUID, request: Request, db: Session = Depends(get_db)):
    document = db.query(Document).filter(Document.id == document_id).first()
    if not document:
        raise ResourceNotFoundException("Document", str(document_id))

    # Delete file from disk
    if os.path.exists(document.filepath):
        try:
            os.remove(document.filepath)
        except OSError:
            # Log but don't fail if file deletion fails
            pass

    try:
        db.delete(document)
        db.commit()
    except SQLAlchemyError:
        db.rollback()
        raise DatabaseException("Failed to delete document", operation="delete")
