"""add quiz_code to lessons

Revision ID: f0bdf127d5ef
Revises: 0bdf70a1ee8b
Create Date: 2026-01-06 17:10:02.095445

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f0bdf127d5ef'
down_revision: Union[str, Sequence[str], None] = '0bdf70a1ee8b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('lessons', sa.Column('quiz_code', sa.String(length=10), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('lessons', 'quiz_code')
