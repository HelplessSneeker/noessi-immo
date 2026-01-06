from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from uuid import UUID
from decimal import Decimal

from ..database import get_db
from ..models import Credit, Transaction
from ..schemas import CreditCreate, CreditUpdate, CreditResponse

router = APIRouter(prefix="/credits", tags=["Credits"])


def calculate_current_balance(db: Session, credit: Credit) -> Decimal:
    """Calculate current balance by subtracting all payments from original amount."""
    payments = db.query(func.coalesce(func.sum(Transaction.amount), 0)).filter(
        Transaction.credit_id == credit.id
    ).scalar()
    return credit.original_amount - payments


@router.get("/", response_model=List[CreditResponse])
def get_credits(property_id: UUID = None, db: Session = Depends(get_db)):
    query = db.query(Credit)
    if property_id:
        query = query.filter(Credit.property_id == property_id)
    
    credits = query.all()
    
    # Add calculated balance to each credit
    result = []
    for credit in credits:
        credit_dict = CreditResponse.model_validate(credit).model_dump()
        credit_dict['current_balance'] = calculate_current_balance(db, credit)
        result.append(CreditResponse(**credit_dict))
    
    return result


@router.get("/{credit_id}", response_model=CreditResponse)
def get_credit(credit_id: UUID, db: Session = Depends(get_db)):
    credit = db.query(Credit).filter(Credit.id == credit_id).first()
    if not credit:
        raise HTTPException(status_code=404, detail="Credit not found")
    
    credit_dict = CreditResponse.model_validate(credit).model_dump()
    credit_dict['current_balance'] = calculate_current_balance(db, credit)
    return CreditResponse(**credit_dict)


@router.post("/", response_model=CreditResponse, status_code=201)
def create_credit(credit_data: CreditCreate, db: Session = Depends(get_db)):
    credit = Credit(**credit_data.model_dump())
    db.add(credit)
    db.commit()
    db.refresh(credit)
    
    credit_dict = CreditResponse.model_validate(credit).model_dump()
    credit_dict['current_balance'] = credit.original_amount
    return CreditResponse(**credit_dict)


@router.put("/{credit_id}", response_model=CreditResponse)
def update_credit(credit_id: UUID, credit_data: CreditUpdate, db: Session = Depends(get_db)):
    credit = db.query(Credit).filter(Credit.id == credit_id).first()
    if not credit:
        raise HTTPException(status_code=404, detail="Credit not found")
    
    update_data = credit_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(credit, key, value)
    
    db.commit()
    db.refresh(credit)
    
    credit_dict = CreditResponse.model_validate(credit).model_dump()
    credit_dict['current_balance'] = calculate_current_balance(db, credit)
    return CreditResponse(**credit_dict)


@router.delete("/{credit_id}", status_code=204)
def delete_credit(credit_id: UUID, db: Session = Depends(get_db)):
    credit = db.query(Credit).filter(Credit.id == credit_id).first()
    if not credit:
        raise HTTPException(status_code=404, detail="Credit not found")
    
    # Check if there are transactions linked to this credit
    linked_transactions = db.query(Transaction).filter(
        Transaction.credit_id == credit_id
    ).count()
    
    if linked_transactions > 0:
        raise HTTPException(
            status_code=400, 
            detail=f"Cannot delete credit with {linked_transactions} linked transactions"
        )
    
    db.delete(credit)
    db.commit()
