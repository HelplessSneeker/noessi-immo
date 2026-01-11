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
from typing import List, Optional
from uuid import UUID, uuid4
from datetime import date
import os
import aiofiles

from ..database import get_db
from ..models import Document, DocumentCategory
from ..schemas import DocumentResponse
from ..i18n.translator import translator

router = APIRouter(prefix="/documents", tags=["Documents"])

# Use environment variable or default to local path for development
UPLOAD_DIR = os.getenv("UPLOAD_DIR", os.path.join(os.getcwd(), "documents"))


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
        raise HTTPException(
            status_code=404, detail=translator.translate("Document not found", request)
        )
    return document


@router.get("/{document_id}/download")
def download_document(
    document_id: UUID, request: Request, db: Session = Depends(get_db)
):
    document = db.query(Document).filter(Document.id == document_id).first()
    if not document:
        raise HTTPException(
            status_code=404, detail=translator.translate("Document not found", request)
        )

    if not os.path.exists(document.filepath):
        raise HTTPException(
            status_code=404,
            detail=translator.translate("File not found on disk", request),
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
        raise HTTPException(
            status_code=400, detail=translator.translate("No file selected", request)
        )

    # Convert category string to enum
    try:
        category_enum = DocumentCategory(category)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid category: {category}")

    # Validate mutual exclusivity
    if transaction_id is not None and credit_id is not None:
        raise HTTPException(
            status_code=400,
            detail=translator.translate(
                "Document cannot be linked to both transaction and credit", request
            ),
        )

    # Generate unique filename
    file_ext = os.path.splitext(file.filename)[1] if file.filename else ""
    unique_filename = f"{uuid4()}{file_ext}"
    filepath = os.path.join(UPLOAD_DIR, str(property_id), unique_filename)

    # Ensure directory exists
    os.makedirs(os.path.dirname(filepath), exist_ok=True)

    # Save file
    async with aiofiles.open(filepath, "wb") as out_file:
        content = await file.read()
        await out_file.write(content)

    # Create database record
    document = Document(
        property_id=property_id,
        transaction_id=transaction_id,
        credit_id=credit_id,
        filename=file.filename or unique_filename,
        filepath=filepath,
        document_date=document_date,
        category=category_enum.value,
        description=description,
    )

    db.add(document)
    db.commit()
    db.refresh(document)

    return document


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
        raise HTTPException(
            status_code=404, detail=translator.translate("Document not found", request)
        )

    # Validate mutual exclusivity if both are being set
    updated_transaction_id = (
        transaction_id if transaction_id is not None else document.transaction_id
    )
    updated_credit_id = credit_id if credit_id is not None else document.credit_id

    if updated_transaction_id is not None and updated_credit_id is not None:
        raise HTTPException(
            status_code=400,
            detail=translator.translate(
                "Document cannot be linked to both transaction and credit", request
            ),
        )

    if category is not None:
        try:
            category_enum = DocumentCategory(category)
            document.category = category_enum.value
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid category: {category}")
    if transaction_id is not None:
        document.transaction_id = transaction_id
    if credit_id is not None:
        document.credit_id = credit_id
    if document_date is not None:
        document.document_date = document_date
    if description is not None:
        document.description = description

    db.commit()
    db.refresh(document)
    return document


@router.delete("/{document_id}", status_code=204)
def delete_document(document_id: UUID, request: Request, db: Session = Depends(get_db)):
    document = db.query(Document).filter(Document.id == document_id).first()
    if not document:
        raise HTTPException(
            status_code=404, detail=translator.translate("Document not found", request)
        )

    # Delete file from disk
    if os.path.exists(document.filepath):
        os.remove(document.filepath)

    db.delete(document)
    db.commit()
