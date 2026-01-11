from pydantic import BaseModel, ConfigDict
from datetime import date, datetime
from decimal import Decimal
from uuid import UUID
from typing import Optional, List
from enum import Enum


# Enums (matching SQLAlchemy enums)
class TransactionType(str, Enum):
    INCOME = "income"
    EXPENSE = "expense"


class TransactionCategory(str, Enum):
    RENT = "rent"
    OPERATING_COSTS = "operating_costs"
    REPAIR = "repair"
    LOAN_PAYMENT = "loan_payment"
    TAX = "tax"
    OTHER = "other"


class DocumentCategory(str, Enum):
    RENTAL_CONTRACT = "rental_contract"
    INVOICE = "invoice"
    TAX = "tax"
    PROPERTY_MANAGEMENT = "property_management"
    LOAN = "loan"
    OTHER = "other"


# Property Schemas
class PropertyBase(BaseModel):
    name: str
    address: str
    purchase_date: Optional[date] = None
    purchase_price: Optional[Decimal] = None
    notes: Optional[str] = None


class PropertyCreate(PropertyBase):
    pass


class PropertyUpdate(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    purchase_date: Optional[date] = None
    purchase_price: Optional[Decimal] = None
    notes: Optional[str] = None


class PropertyResponse(PropertyBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# Credit Schemas
class CreditBase(BaseModel):
    name: str
    original_amount: Decimal
    interest_rate: Decimal
    monthly_payment: Decimal
    start_date: date
    end_date: Optional[date] = None


class CreditCreate(CreditBase):
    property_id: UUID


class CreditUpdate(BaseModel):
    name: Optional[str] = None
    original_amount: Optional[Decimal] = None
    interest_rate: Optional[Decimal] = None
    monthly_payment: Optional[Decimal] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None


class CreditResponse(CreditBase):
    id: UUID
    property_id: UUID
    current_balance: Optional[Decimal] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# Transaction Schemas
class TransactionBase(BaseModel):
    date: date
    type: TransactionType
    category: TransactionCategory
    amount: Decimal
    description: Optional[str] = None
    recurring: bool = False


class TransactionCreate(TransactionBase):
    property_id: UUID
    credit_id: Optional[UUID] = None


class TransactionUpdate(BaseModel):
    date: Optional[date] = None
    type: Optional[TransactionType] = None
    category: Optional[TransactionCategory] = None
    amount: Optional[Decimal] = None
    description: Optional[str] = None
    recurring: Optional[bool] = None
    credit_id: Optional[UUID] = None


class TransactionResponse(TransactionBase):
    id: UUID
    property_id: UUID
    credit_id: Optional[UUID] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# Document Schemas
class DocumentBase(BaseModel):
    document_date: Optional[date] = None
    category: DocumentCategory
    description: Optional[str] = None


class DocumentCreate(DocumentBase):
    property_id: UUID
    transaction_id: Optional[UUID] = None
    credit_id: Optional[UUID] = None


class DocumentResponse(DocumentBase):
    id: UUID
    property_id: UUID
    transaction_id: Optional[UUID] = None
    credit_id: Optional[UUID] = None
    filename: str
    filepath: str
    upload_date: datetime
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# Extended Response with relations
class PropertyDetailResponse(PropertyResponse):
    credits: List[CreditResponse] = []
    transactions: List[TransactionResponse] = []
    documents: List[DocumentResponse] = []


# Summary/Statistics Schemas
class PropertySummary(BaseModel):
    property: PropertyResponse
    total_income: Decimal
    total_expenses: Decimal
    balance: Decimal
    total_credit_balance: Decimal
    document_count: int
