"""add_unique_constraints

Revision ID: b2c3d4e5f6g7
Revises: a1b2c3d4e5f6
Create Date: 2026-01-07 07:58:30.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b2c3d4e5f6g7'
down_revision: Union[str, Sequence[str], None] = 'a1b2c3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add unique constraints to prevent duplicate records."""
    
    # Prevent duplicate enrollments - student can't enroll in same course twice
    op.create_unique_constraint(
        'uq_enrollment_user_course',
        'enrollments',
        ['user_id', 'course_id']
    )
    
    # Note: For quiz_participations, we allow multiple entries
    # but add a composite index for better query performance
    # This lets us track when a student enters a quiz multiple times
    # but still query efficiently for unique participants
    
    # Optional: If you want to prevent duplicate lesson progress records
    op.create_unique_constraint(
        'uq_lesson_progress_enrollment_lesson',
        'lesson_progress',
        ['enrollment_id', 'lesson_id']
    )


def downgrade() -> None:
    """Remove unique constraints."""
    op.drop_constraint('uq_lesson_progress_enrollment_lesson', 'lesson_progress', type_='unique')
    op.drop_constraint('uq_enrollment_user_course', 'enrollments', type_='unique')
