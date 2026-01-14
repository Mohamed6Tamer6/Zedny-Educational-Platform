"""merge heads

Revision ID: c4412153ce4c
Revises: c3d4e5f6g7h8, f0bdf127d5ef
Create Date: 2026-01-13 12:50:24.123114

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c4412153ce4c'
down_revision: Union[str, Sequence[str], None] = ('c3d4e5f6g7h8', 'f0bdf127d5ef')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
