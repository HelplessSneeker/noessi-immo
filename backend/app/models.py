import uuid
from datetime import datetime, date
from sqlalchemy import Column, String, Date, DateTime, Numeric, Boolean, ForeignKey, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import enum

from .database import Base


# Enums
class TransactionType(str, enum.Enum):
    INCOME = "income"
    EXPENSE = "expense"


class TransactionCategory(str, enum.Enum):
    RENT = "rent"
    OPERATING_COSTS = "operating_costs"
    REPAIR = "repair"
    LOAN_PAYMENT = "loan_payment"
    TAX = "tax"
    OTHER = "other"


class DocumentCategory(str, enum.Enum):
    RENTAL_CONTRACT = "rental_contract"
    INVOICE = "invoice"
    TAX = "tax"
    PROPERTY_MANAGEMENT = "property_management"
    LOAN = "loan"
    OTHER = "other"


# Models
class Property(Base):
    __tablename__ = "properties"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), nullable=False)
    address = Column(String(255), nullable=False)
    purchase_date = Column(Date, nullable=True)
    purchase_price = Column(Numeric(12, 2), nullable=True)
    notes = Column(String(1000), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    credits = relationship("Credit", back_populates="property", cascade="all, delete-orphan")
    transactions = relationship("Transaction", back_populates="property", cascade="all, delete-orphan")
    documents = relationship("Document", back_populates="property", cascade="all, delete-orphan")


class Credit(Base):
    __tablename__ = "credits"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    property_id = Column(UUID(as_uuid=True), ForeignKey("properties.id"), nullable=False)
    name = Column(String(100), nullable=False)
    original_amount = Column(Numeric(12, 2), nullable=False)
    interest_rate = Column(Numeric(5, 2), nullable=False)  # z.B. 3.50 für 3.5%
    monthly_payment = Column(Numeric(10, 2), nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    property = relationship("Property", back_populates="credits")
    transactions = relationship("Transaction", back_populates="credit")
    documents = relationship("Document", back_populates="credit")


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    property_id = Column(UUID(as_uuid=True), ForeignKey("properties.id"), nullable=False)
    credit_id = Column(UUID(as_uuid=True), ForeignKey("credits.id"), nullable=True)
    date = Column(Date, nullable=False)
    type = Column(
        SQLEnum(TransactionType, values_callable=lambda obj: [e.value for e in obj], create_type=False, name='transactiontype'),
        nullable=False
    )
    category = Column(
        SQLEnum(TransactionCategory, values_callable=lambda obj: [e.value for e in obj], create_type=False, name='transactioncategory'),
        nullable=False
    )
    amount = Column(Numeric(10, 2), nullable=False)
    description = Column(String(500), nullable=True)
    recurring = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    property = relationship("Property", back_populates="transactions")
    credit = relationship("Credit", back_populates="transactions")
    documents = relationship("Document", back_populates="transaction")


class Document(Base):
    __tablename__ = "documents"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    property_id = Column(UUID(as_uuid=True), ForeignKey("properties.id"), nullable=False)
    transaction_id = Column(UUID(as_uuid=True), ForeignKey("transactions.id"), nullable=True)
    credit_id = Column(UUID(as_uuid=True), ForeignKey("credits.id"), nullable=True)
    filename = Column(String(255), nullable=False)
    filepath = Column(String(500), nullable=False)
    upload_date = Column(DateTime, default=datetime.utcnow)
    document_date = Column(Date, nullable=True)
    category = Column(
        SQLEnum(DocumentCategory, values_callable=lambda obj: [e.value for e in obj], create_type=False, name='documentcategory'),
        nullable=False
    )
    description = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    property = relationship("Property", back_populates="documents")
    transaction = relationship("Transaction", back_populates="documents")
    credit = relationship("Credit", back_populates="documents")
