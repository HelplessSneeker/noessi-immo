from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query
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
    db: Session = Depends(get_db)
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
def get_document(document_id: UUID, db: Session = Depends(get_db)):
    document = db.query(Document).filter(Document.id == document_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    return document


@router.get("/{document_id}/download")
def download_document(document_id: UUID, db: Session = Depends(get_db)):
    document = db.query(Document).filter(Document.id == document_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    if not os.path.exists(document.filepath):
        raise HTTPException(status_code=404, detail="File not found on disk")
    
    return FileResponse(
        path=document.filepath,
        filename=document.filename,
        media_type="application/octet-stream"
    )


@router.post("/", response_model=DocumentResponse, status_code=201)
async def upload_document(
    file: UploadFile = File(...),
    property_id: UUID = Form(...),
    category: DocumentCategory = Form(...),
    transaction_id: Optional[UUID] = Form(None),
    credit_id: Optional[UUID] = Form(None),
    document_date: Optional[date] = Form(None),
    description: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    # Validate file
    if not file.filename:
        raise HTTPException(status_code=400, detail="Keine Datei ausgewählt")

    # Validate mutual exclusivity
    if transaction_id is not None and credit_id is not None:
        raise HTTPException(
            status_code=400,
            detail="Dokument kann nicht gleichzeitig mit Transaktion und Kredit verknüpft werden"
        )

    # Generate unique filename
    file_ext = os.path.splitext(file.filename)[1] if file.filename else ""
    unique_filename = f"{uuid4()}{file_ext}"
    filepath = os.path.join(UPLOAD_DIR, str(property_id), unique_filename)

    # Ensure directory exists
    os.makedirs(os.path.dirname(filepath), exist_ok=True)

    # Save file
    async with aiofiles.open(filepath, 'wb') as out_file:
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
        category=category,
        description=description
    )

    db.add(document)
    db.commit()
    db.refresh(document)

    return document


@router.put("/{document_id}", response_model=DocumentResponse)
def update_document(
    document_id: UUID,
    category: Optional[DocumentCategory] = Form(None),
    transaction_id: Optional[UUID] = Form(None),
    credit_id: Optional[UUID] = Form(None),
    document_date: Optional[date] = Form(None),
    description: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    document = db.query(Document).filter(Document.id == document_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    # Validate mutual exclusivity if both are being set
    updated_transaction_id = transaction_id if transaction_id is not None else document.transaction_id
    updated_credit_id = credit_id if credit_id is not None else document.credit_id

    if updated_transaction_id is not None and updated_credit_id is not None:
        raise HTTPException(
            status_code=400,
            detail="Dokument kann nicht gleichzeitig mit Transaktion und Kredit verknüpft werden"
        )

    if category is not None:
        document.category = category
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
def delete_document(document_id: UUID, db: Session = Depends(get_db)):
    document = db.query(Document).filter(Document.id == document_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Delete file from disk
    if os.path.exists(document.filepath):
        os.remove(document.filepath)
    
    db.delete(document)
    db.commit()
