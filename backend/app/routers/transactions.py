from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from typing import List, Optional
from uuid import UUID
from datetime import date, timedelta

from ..database import get_db
from ..models import Transaction, TransactionType, TransactionCategory, Property, Credit
from ..schemas import TransactionCreate, TransactionUpdate, TransactionResponse
from ..exceptions import (
    ResourceNotFoundException,
    BusinessLogicException,
    DatabaseException
)
from ..i18n.translator import translator

router = APIRouter(prefix="/transactions", tags=["Transactions"])


@router.get("/", response_model=List[TransactionResponse])
def get_transactions(
    property_id: Optional[UUID] = None,
    credit_id: Optional[UUID] = None,
    type: Optional[TransactionType] = None,
    category: Optional[TransactionCategory] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db)
):
    query = db.query(Transaction)

    if property_id:
        query = query.filter(Transaction.property_id == property_id)
    if credit_id:
        query = query.filter(Transaction.credit_id == credit_id)
    if type:
        query = query.filter(Transaction.type == type)
    if category:
        query = query.filter(Transaction.category == category)
    if date_from:
        query = query.filter(Transaction.date >= date_from)
    if date_to:
        query = query.filter(Transaction.date <= date_to)
    
    return query.order_by(Transaction.date.desc()).offset(skip).limit(limit).all()


@router.get("/{transaction_id}", response_model=TransactionResponse)
def get_transaction(transaction_id: UUID, request: Request, db: Session = Depends(get_db)):
    transaction = db.query(Transaction).filter(Transaction.id == transaction_id).first()
    if not transaction:
        raise ResourceNotFoundException("Transaction", str(transaction_id))
    return transaction


@router.post("/", response_model=TransactionResponse, status_code=201)
def create_transaction(
    transaction_data: TransactionCreate,
    request: Request,
    db: Session = Depends(get_db)
):
    # Validate property exists
    property = db.query(Property).filter(Property.id == transaction_data.property_id).first()
    if not property:
        raise ResourceNotFoundException("Property", str(transaction_data.property_id))

    # Validate credit exists if provided
    if transaction_data.credit_id:
        credit = db.query(Credit).filter(Credit.id == transaction_data.credit_id).first()
        if not credit:
            raise ResourceNotFoundException("Credit", str(transaction_data.credit_id))

        # Ensure credit belongs to same property
        if credit.property_id != transaction_data.property_id:
            raise BusinessLogicException(
                translator.translate("Credit must belong to the same property", request)
            )

        # Suggest loan_payment category if linked to credit
        if transaction_data.category != TransactionCategory.LOAN_PAYMENT:
            raise BusinessLogicException(
                translator.translate(
                    "Transaction linked to credit should use 'loan_payment' category",
                    request
                )
            )

    # Amount validation
    if transaction_data.amount <= 0:
        raise BusinessLogicException(
            translator.translate("Amount must be positive", request)
        )

    # Category/Type compatibility validation
    if transaction_data.type == TransactionType.INCOME and transaction_data.category in [
        TransactionCategory.REPAIR,
        TransactionCategory.LOAN_PAYMENT,
        TransactionCategory.OPERATING_COSTS,
    ]:
        raise BusinessLogicException(
            translator.translate("Category incompatible with income type", request)
        )

    # Date validation (not more than 1 year in future)
    max_future_date = date.today() + timedelta(days=365)
    if transaction_data.date > max_future_date:
        raise BusinessLogicException(
            translator.translate(
                "Transaction date cannot be more than 1 year in the future",
                request
            )
        )

    try:
        transaction = Transaction(**transaction_data.model_dump())
        db.add(transaction)
        db.commit()
        db.refresh(transaction)
        return transaction
    except SQLAlchemyError:
        db.rollback()
        raise DatabaseException("Failed to create transaction", operation="create")


@router.put("/{transaction_id}", response_model=TransactionResponse)
def update_transaction(
    transaction_id: UUID,
    transaction_data: TransactionUpdate,
    request: Request,
    db: Session = Depends(get_db)
):
    transaction = db.query(Transaction).filter(Transaction.id == transaction_id).first()
    if not transaction:
        raise ResourceNotFoundException("Transaction", str(transaction_id))

    update_data = transaction_data.model_dump(exclude_unset=True)

    # Validate updated credit if provided
    if 'credit_id' in update_data and update_data['credit_id']:
        credit = db.query(Credit).filter(Credit.id == update_data['credit_id']).first()
        if not credit:
            raise ResourceNotFoundException("Credit", str(update_data['credit_id']))

        # Ensure credit belongs to same property
        property_id = update_data.get('property_id', transaction.property_id)
        if credit.property_id != property_id:
            raise BusinessLogicException(
                translator.translate("Credit must belong to the same property", request)
            )

    # Amount validation
    if 'amount' in update_data and update_data['amount'] <= 0:
        raise BusinessLogicException(
            translator.translate("Amount must be positive", request)
        )

    # Date validation
    if 'date' in update_data:
        max_future_date = date.today() + timedelta(days=365)
        if update_data['date'] > max_future_date:
            raise BusinessLogicException(
                translator.translate(
                    "Transaction date cannot be more than 1 year in the future",
                    request
                )
            )

    for key, value in update_data.items():
        setattr(transaction, key, value)

    try:
        db.commit()
        db.refresh(transaction)
        return transaction
    except SQLAlchemyError:
        db.rollback()
        raise DatabaseException("Failed to update transaction", operation="update")


@router.delete("/{transaction_id}", status_code=204)
def delete_transaction(transaction_id: UUID, request: Request, db: Session = Depends(get_db)):
    transaction = db.query(Transaction).filter(Transaction.id == transaction_id).first()
    if not transaction:
        raise ResourceNotFoundException("Transaction", str(transaction_id))

    try:
        db.delete(transaction)
        db.commit()
    except SQLAlchemyError:
        db.rollback()
        raise DatabaseException("Failed to delete transaction", operation="delete")
