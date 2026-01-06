from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from uuid import UUID
from decimal import Decimal

from ..database import get_db
from ..models import Property, Transaction, Credit, Document, TransactionType
from ..schemas import (
    PropertyCreate, PropertyUpdate, PropertyResponse, 
    PropertyDetailResponse, PropertySummary
)

router = APIRouter(prefix="/properties", tags=["Properties"])


@router.get("/", response_model=List[PropertyResponse])
def get_properties(db: Session = Depends(get_db)):
    return db.query(Property).all()


@router.get("/{property_id}", response_model=PropertyDetailResponse)
def get_property(property_id: UUID, db: Session = Depends(get_db)):
    property = db.query(Property).filter(Property.id == property_id).first()
    if not property:
        raise HTTPException(status_code=404, detail="Property not found")
    return property


@router.get("/{property_id}/summary", response_model=PropertySummary)
def get_property_summary(property_id: UUID, db: Session = Depends(get_db)):
    property = db.query(Property).filter(Property.id == property_id).first()
    if not property:
        raise HTTPException(status_code=404, detail="Property not found")
    
    # Calculate totals
    income = db.query(func.coalesce(func.sum(Transaction.amount), 0)).filter(
        Transaction.property_id == property_id,
        Transaction.type == TransactionType.INCOME
    ).scalar()
    
    expenses = db.query(func.coalesce(func.sum(Transaction.amount), 0)).filter(
        Transaction.property_id == property_id,
        Transaction.type == TransactionType.EXPENSE
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
def create_property(property_data: PropertyCreate, db: Session = Depends(get_db)):
    property = Property(**property_data.model_dump())
    db.add(property)
    db.commit()
    db.refresh(property)
    return property


@router.put("/{property_id}", response_model=PropertyResponse)
def update_property(property_id: UUID, property_data: PropertyUpdate, db: Session = Depends(get_db)):
    property = db.query(Property).filter(Property.id == property_id).first()
    if not property:
        raise HTTPException(status_code=404, detail="Property not found")
    
    update_data = property_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(property, key, value)
    
    db.commit()
    db.refresh(property)
    return property


@router.delete("/{property_id}", status_code=204)
def delete_property(property_id: UUID, db: Session = Depends(get_db)):
    property = db.query(Property).filter(Property.id == property_id).first()
    if not property:
        raise HTTPException(status_code=404, detail="Property not found")
    
    db.delete(property)
    db.commit()
