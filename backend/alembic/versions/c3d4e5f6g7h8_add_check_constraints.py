"""add_check_constraints

Revision ID: c3d4e5f6g7h8
Revises: b2c3d4e5f6g7
Create Date: 2026-01-07 07:59:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c3d4e5f6g7h8'
down_revision: Union[str, Sequence[str], None] = 'b2c3d4e5f6g7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add check constraints for data validation."""
    
    # Enrollment progress must be between 0 and 100
    op.create_check_constraint(
        'ck_enrollment_progress_range',
        'enrollments',
        'progress_percent >= 0 AND progress_percent <= 100'
    )
    
    # Question time limit must be positive
    op.create_check_constraint(
        'ck_question_time_limit_positive',
        'questions',
        'time_limit > 0'
    )
    
    # Question points must be positive
    op.create_check_constraint(
        'ck_question_points_positive',
        'questions',
        'points > 0'
    )
    
    # Quiz attempt score must be non-negative
    op.create_check_constraint(
        'ck_quiz_attempt_score_positive',
        'quiz_attempts',
        'score >= 0'
    )
    
    # Quiz attempt correct answers must be non-negative and <= total
    op.create_check_constraint(
        'ck_quiz_attempt_correct_answers_valid',
        'quiz_attempts',
        'correct_answers >= 0 AND correct_answers <= total_questions'
    )
    
    # Lesson duration must be non-negative
    op.create_check_constraint(
        'ck_lesson_duration_positive',
        'lessons',
        'duration_minutes >= 0'
    )
    
    # Lesson progress time spent must be non-negative
    op.create_check_constraint(
        'ck_lesson_progress_time_positive',
        'lesson_progress',
        'time_spent_seconds >= 0'
    )
    
    # Lesson order index must be non-negative
    op.create_check_constraint(
        'ck_lesson_order_positive',
        'lessons',
        'order_index >= 0'
    )


def downgrade() -> None:
    """Remove check constraints."""
    op.drop_constraint('ck_lesson_order_positive', 'lessons', type_='check')
    op.drop_constraint('ck_lesson_progress_time_positive', 'lesson_progress', type_='check')
    op.drop_constraint('ck_lesson_duration_positive', 'lessons', type_='check')
    op.drop_constraint('ck_quiz_attempt_correct_answers_valid', 'quiz_attempts', type_='check')
    op.drop_constraint('ck_quiz_attempt_score_positive', 'quiz_attempts', type_='check')
    op.drop_constraint('ck_question_points_positive', 'questions', type_='check')
    op.drop_constraint('ck_question_time_limit_positive', 'questions', type_='check')
    op.drop_constraint('ck_enrollment_progress_range', 'enrollments', type_='check')
