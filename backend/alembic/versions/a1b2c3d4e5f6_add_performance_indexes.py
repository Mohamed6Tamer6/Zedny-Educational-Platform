"""add_performance_indexes

Revision ID: a1b2c3d4e5f6
Revises: 0bdf70a1ee8b
Create Date: 2026-01-07 07:58:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, Sequence[str], None] = '0bdf70a1ee8b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add performance indexes for common queries."""
    
    # Teacher dashboard queries - List quizzes by teacher
    op.create_index(
        'idx_quizzes_teacher_id',
        'quizzes',
        ['teacher_id'],
        unique=False
    )
    
    # Teacher dashboard queries - List courses by teacher
    op.create_index(
        'idx_courses_teacher_id',
        'courses',
        ['teacher_id'],
        unique=False
    )
    
    # Student dashboard queries - List enrollments by student
    op.create_index(
        'idx_enrollments_user_id',
        'enrollments',
        ['user_id'],
        unique=False
    )
    
    # Student quiz history - List attempts by student
    op.create_index(
        'idx_quiz_attempts_user_id',
        'quiz_attempts',
        ['user_id'],
        unique=False
    )
    
    # Composite index for checking if user already attempted quiz
    op.create_index(
        'idx_quiz_attempts_quiz_user',
        'quiz_attempts',
        ['quiz_id', 'user_id'],
        unique=False
    )
    
    # Composite index for checking enrollment status
    op.create_index(
        'idx_enrollments_course_user',
        'enrollments',
        ['course_id', 'user_id'],
        unique=False
    )
    
    # Composite index for lesson progress lookup
    op.create_index(
        'idx_lesson_progress_enrollment_lesson',
        'lesson_progress',
        ['enrollment_id', 'lesson_id'],
        unique=False
    )
    
    # Index for quiz participation queries
    op.create_index(
        'idx_quiz_participations_quiz_id',
        'quiz_participations',
        ['quiz_id'],
        unique=False
    )
    
    # Index for faster lesson ordering
    op.create_index(
        'idx_lessons_course_order',
        'lessons',
        ['course_id', 'order_index'],
        unique=False
    )


def downgrade() -> None:
    """Remove performance indexes."""
    op.drop_index('idx_lessons_course_order', table_name='lessons')
    op.drop_index('idx_quiz_participations_quiz_id', table_name='quiz_participations')
    op.drop_index('idx_lesson_progress_enrollment_lesson', table_name='lesson_progress')
    op.drop_index('idx_enrollments_course_user', table_name='enrollments')
    op.drop_index('idx_quiz_attempts_quiz_user', table_name='quiz_attempts')
    op.drop_index('idx_quiz_attempts_user_id', table_name='quiz_attempts')
    op.drop_index('idx_enrollments_user_id', table_name='enrollments')
    op.drop_index('idx_courses_teacher_id', table_name='courses')
    op.drop_index('idx_quizzes_teacher_id', table_name='quizzes')
