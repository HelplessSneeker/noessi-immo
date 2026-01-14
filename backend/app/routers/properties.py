from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from sqlalchemy import func
from sqlalchemy.exc import SQLAlchemyError
from typing import List
from uuid import UUID
from decimal import Decimal

from ..database import get_db
from ..models import Property, Transaction, Credit, Document, TransactionType
from ..schemas import (
    PropertyCreate, PropertyUpdate, PropertyResponse,
    PropertyDetailResponse, PropertySummary
)
from ..exceptions import (
    ResourceNotFoundException,
    ForeignKeyConstraintException,
    BusinessLogicException,
    DatabaseException
)
from ..i18n.translator import translator

router = APIRouter(prefix="/properties", tags=["Properties"])


@router.get("/", response_model=List[PropertyResponse])
def get_properties(db: Session = Depends(get_db)):
    return db.query(Property).all()


@router.get("/{property_id}", response_model=PropertyDetailResponse)
def get_property(property_id: UUID, request: Request, db: Session = Depends(get_db)):
    property = db.query(Property).filter(Property.id == property_id).first()
    if not property:
        raise ResourceNotFoundException("Property", str(property_id))
    return property


@router.get("/{property_id}/summary", response_model=PropertySummary)
def get_property_summary(property_id: UUID, request: Request, db: Session = Depends(get_db)):
    property = db.query(Property).filter(Property.id == property_id).first()
    if not property:
        raise ResourceNotFoundException("Property", str(property_id))
    
    # Calculate totals
    income = db.query(func.coalesce(func.sum(Transaction.amount), 0)).filter(
        Transaction.property_id == property_id,
        Transaction.type == TransactionType.INCOME.value
    ).scalar()

    expenses = db.query(func.coalesce(func.sum(Transaction.amount), 0)).filter(
        Transaction.property_id == property_id,
        Transaction.type == TransactionType.EXPENSE.value
    ).scalar()
    
    # Calculate credit balance (original - paid back)
    credits = db.query(Credit).filter(Credit.property_id == property_id).all()
    total_credit_original = sum(c.original_amount for c in credits) if credits else Decimal(0)
    
    credit_payments = db.query(func.coalesce(func.sum(Transaction.amount), 0)).filter(
        Transaction.property_id == property_id,
        Transaction.credit_id.isnot(None)
    ).scalar()
    
    total_credit_balance = total_credit_original - credit_payments
    
    doc_count = db.query(func.count(Document.id)).filter(
        Document.property_id == property_id
    ).scalar()
    
    return PropertySummary(
        property=property,
        total_income=income,
        total_expenses=expenses,
        balance=income - expenses,
        total_credit_balance=total_credit_balance,
        document_count=doc_count
    )


@router.post("/", response_model=PropertyResponse, status_code=201)
def create_property(
    property_data: PropertyCreate,
    request: Request,
    db: Session = Depends(get_db)
):
    # Validate purchase price if provided
    if property_data.purchase_price is not None and property_data.purchase_price < 0:
        raise BusinessLogicException(
            translator.translate("Purchase price cannot be negative", request)
        )

    try:
        property = Property(**property_data.model_dump())
        db.add(property)
        db.commit()
        db.refresh(property)
        return property
    except SQLAlchemyError:
        db.rollback()
        raise DatabaseException("Failed to create property", operation="create")


@router.put("/{property_id}", response_model=PropertyResponse)
def update_property(
    property_id: UUID,
    property_data: PropertyUpdate,
    request: Request,
    db: Session = Depends(get_db)
):
    property = db.query(Property).filter(Property.id == property_id).first()
    if not property:
        raise ResourceNotFoundException("Property", str(property_id))

    update_data = property_data.model_dump(exclude_unset=True)

    # Validate purchase price if being updated
    if 'purchase_price' in update_data and update_data['purchase_price'] is not None:
        if update_data['purchase_price'] < 0:
            raise BusinessLogicException(
                translator.translate("Purchase price cannot be negative", request)
            )

    for key, value in update_data.items():
        setattr(property, key, value)

    try:
        db.commit()
        db.refresh(property)
        return property
    except SQLAlchemyError:
        db.rollback()
        raise DatabaseException("Failed to update property", operation="update")


@router.delete("/{property_id}", status_code=204)
def delete_property(property_id: UUID, request: Request, db: Session = Depends(get_db)):
    property = db.query(Property).filter(Property.id == property_id).first()
    if not property:
        raise ResourceNotFoundException("Property", str(property_id))

    # Check for child resources before deletion
    credit_count = db.query(Credit).filter(Credit.property_id == property_id).count()
    transaction_count = db.query(Transaction).filter(Transaction.property_id == property_id).count()
    document_count = db.query(Document).filter(Document.property_id == property_id).count()

    if credit_count > 0 or transaction_count > 0 or document_count > 0:
        raise ForeignKeyConstraintException(
            message=translator.translate(
                "Cannot delete property with existing credits, transactions, or documents",
                request
            ),
            parent_resource="Property",
            child_resource=f"{credit_count} credits, {transaction_count} transactions, {document_count} documents"
        )

    try:
        db.delete(property)
        db.commit()
    except SQLAlchemyError:
        db.rollback()
        raise DatabaseException("Failed to delete property", operation="delete")
