from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from sqlalchemy import func
from sqlalchemy.exc import SQLAlchemyError
from typing import List
from uuid import UUID
from decimal import Decimal
from datetime import date as date_type

from ..database import get_db
from ..models import Credit, Transaction, Property
from ..schemas import CreditCreate, CreditUpdate, CreditResponse
from ..exceptions import (
    ResourceNotFoundException,
    BusinessLogicException,
    DatabaseException
)
from ..i18n.translator import translator

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
def get_credit(credit_id: UUID, request: Request, db: Session = Depends(get_db)):
    credit = db.query(Credit).filter(Credit.id == credit_id).first()
    if not credit:
        raise ResourceNotFoundException("Credit", str(credit_id))

    credit_dict = CreditResponse.model_validate(credit).model_dump()
    credit_dict['current_balance'] = calculate_current_balance(db, credit)
    return CreditResponse(**credit_dict)


@router.post("/", response_model=CreditResponse, status_code=201)
def create_credit(
    credit_data: CreditCreate,
    request: Request,
    db: Session = Depends(get_db)
):
    # Validate property exists
    property = db.query(Property).filter(Property.id == credit_data.property_id).first()
    if not property:
        raise ResourceNotFoundException("Property", str(credit_data.property_id))

    # Business logic validation
    if credit_data.original_amount <= 0:
        raise BusinessLogicException(
            translator.translate("Original amount must be positive", request)
        )

    if credit_data.interest_rate < 0 or credit_data.interest_rate > 100:
        raise BusinessLogicException(
            translator.translate("Interest rate must be between 0 and 100", request)
        )

    if credit_data.monthly_payment <= 0:
        raise BusinessLogicException(
            translator.translate("Monthly payment must be positive", request)
        )

    if credit_data.monthly_payment > credit_data.original_amount:
        raise BusinessLogicException(
            translator.translate("Monthly payment cannot exceed original amount", request)
        )

    if credit_data.end_date and credit_data.end_date <= credit_data.start_date:
        raise BusinessLogicException(
            translator.translate("End date must be after start date", request)
        )

    if credit_data.start_date > date_type.today():
        raise BusinessLogicException(
            translator.translate("Start date cannot be in the future", request)
        )

    try:
        credit = Credit(**credit_data.model_dump())
        db.add(credit)
        db.commit()
        db.refresh(credit)

        credit_dict = CreditResponse.model_validate(credit).model_dump()
        credit_dict['current_balance'] = credit.original_amount
        return CreditResponse(**credit_dict)
    except SQLAlchemyError:
        db.rollback()
        raise DatabaseException("Failed to create credit", operation="create")


@router.put("/{credit_id}", response_model=CreditResponse)
def update_credit(
    credit_id: UUID,
    credit_data: CreditUpdate,
    request: Request,
    db: Session = Depends(get_db)
):
    credit = db.query(Credit).filter(Credit.id == credit_id).first()
    if not credit:
        raise ResourceNotFoundException("Credit", str(credit_id))

    update_data = credit_data.model_dump(exclude_unset=True)

    # Business logic validation for updated fields
    if 'original_amount' in update_data and update_data['original_amount'] <= 0:
        raise BusinessLogicException(
            translator.translate("Original amount must be positive", request)
        )

    if 'interest_rate' in update_data:
        if update_data['interest_rate'] < 0 or update_data['interest_rate'] > 100:
            raise BusinessLogicException(
                translator.translate("Interest rate must be between 0 and 100", request)
            )

    if 'monthly_payment' in update_data and update_data['monthly_payment'] <= 0:
        raise BusinessLogicException(
            translator.translate("Monthly payment must be positive", request)
        )

    # Check if both dates exist before comparing
    start_date = update_data.get('start_date', credit.start_date)
    end_date = update_data.get('end_date', credit.end_date)
    if end_date and end_date <= start_date:
        raise BusinessLogicException(
            translator.translate("End date must be after start date", request)
        )

    for key, value in update_data.items():
        setattr(credit, key, value)

    try:
        db.commit()
        db.refresh(credit)

        credit_dict = CreditResponse.model_validate(credit).model_dump()
        credit_dict['current_balance'] = calculate_current_balance(db, credit)
        return CreditResponse(**credit_dict)
    except SQLAlchemyError:
        db.rollback()
        raise DatabaseException("Failed to update credit", operation="update")


@router.delete("/{credit_id}", status_code=204)
def delete_credit(credit_id: UUID, request: Request, db: Session = Depends(get_db)):
    credit = db.query(Credit).filter(Credit.id == credit_id).first()
    if not credit:
        raise ResourceNotFoundException("Credit", str(credit_id))

    # Check if there are transactions linked to this credit
    linked_transactions = db.query(Transaction).filter(
        Transaction.credit_id == credit_id
    ).count()

    if linked_transactions > 0:
        raise BusinessLogicException(
            translator.translate("Cannot delete credit with linked transactions", request),
            details={"linked_transactions": linked_transactions}
        )

    try:
        db.delete(credit)
        db.commit()
    except SQLAlchemyError:
        db.rollback()
        raise DatabaseException("Failed to delete credit", operation="delete")
