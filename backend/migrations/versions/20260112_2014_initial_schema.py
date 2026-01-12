"""initial_schema

Revision ID: a8906fcb1fbb
Revises:
Create Date: 2026-01-12 20:14:49.423460+00:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'a8906fcb1fbb'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Get database connection and inspector to check existing objects
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    existing_tables = inspector.get_table_names()

    # Create enum types (only if they don't exist)
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE transactiontype AS ENUM ('income', 'expense');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
    """)
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE transactioncategory AS ENUM ('rent', 'operating_costs', 'repair', 'loan_payment', 'tax', 'other');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
    """)
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE documentcategory AS ENUM ('rental_contract', 'invoice', 'tax', 'property_management', 'loan', 'other');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
    """)

    # Create properties table (if it doesn't exist)
    if 'properties' not in existing_tables:
        op.execute("""
            CREATE TABLE properties (
                id UUID PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                address VARCHAR(255) NOT NULL,
                purchase_date DATE,
                purchase_price NUMERIC(12, 2),
                notes VARCHAR(1000),
                created_at TIMESTAMP,
                updated_at TIMESTAMP
            )
        """)

    # Create credits table (if it doesn't exist)
    if 'credits' not in existing_tables:
        op.execute("""
            CREATE TABLE credits (
                id UUID PRIMARY KEY,
                property_id UUID NOT NULL REFERENCES properties(id),
                name VARCHAR(100) NOT NULL,
                original_amount NUMERIC(12, 2) NOT NULL,
                interest_rate NUMERIC(5, 2) NOT NULL,
                monthly_payment NUMERIC(10, 2) NOT NULL,
                start_date DATE NOT NULL,
                end_date DATE,
                created_at TIMESTAMP,
                updated_at TIMESTAMP
            )
        """)

    # Create transactions table (if it doesn't exist)
    if 'transactions' not in existing_tables:
        op.execute("""
            CREATE TABLE transactions (
                id UUID PRIMARY KEY,
                property_id UUID NOT NULL REFERENCES properties(id),
                credit_id UUID REFERENCES credits(id),
                date DATE NOT NULL,
                type transactiontype NOT NULL,
                category transactioncategory NOT NULL,
                amount NUMERIC(10, 2) NOT NULL,
                description VARCHAR(500),
                recurring BOOLEAN,
                created_at TIMESTAMP,
                updated_at TIMESTAMP
            )
        """)

    # Create documents table (if it doesn't exist)
    if 'documents' not in existing_tables:
        op.execute("""
            CREATE TABLE documents (
                id UUID PRIMARY KEY,
                property_id UUID NOT NULL REFERENCES properties(id),
                transaction_id UUID REFERENCES transactions(id),
                credit_id UUID REFERENCES credits(id),
                filename VARCHAR(255) NOT NULL,
                filepath VARCHAR(500) NOT NULL,
                upload_date TIMESTAMP,
                document_date DATE,
                category documentcategory NOT NULL,
                description VARCHAR(500),
                created_at TIMESTAMP,
                updated_at TIMESTAMP
            )
        """)


def downgrade() -> None:
    # Drop tables in reverse order (to handle foreign keys)
    op.execute("DROP TABLE IF EXISTS documents")
    op.execute("DROP TABLE IF EXISTS transactions")
    op.execute("DROP TABLE IF EXISTS credits")
    op.execute("DROP TABLE IF EXISTS properties")

    # Drop enum types
    op.execute("DROP TYPE IF EXISTS documentcategory")
    op.execute("DROP TYPE IF EXISTS transactioncategory")
    op.execute("DROP TYPE IF EXISTS transactiontype")
