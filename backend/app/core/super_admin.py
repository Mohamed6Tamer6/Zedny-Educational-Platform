"""
=============================================================================
Super Admin Logic Module
=============================================================================
This module contains core logic and permissions specific to the Super Admin role.

The Super Admin has absolute authority over the system, including:
- User management (Teacher/Student)
- Quiz management (View/Edit/Delete any quiz)
- System-wide settings

This module serves as the central point for Super Admin business rules.
=============================================================================
"""

from app.models.user import User, UserRole

def is_super_admin(user: User) -> bool:
    """
    Check if a user has Super Admin privileges.
    """
    return user.role == UserRole.SUPER_ADMIN

def can_manage_user(admin_user: User, target_user: User) -> bool:
    """
    Determine if the admin can manage the target user.
    Super Admin can manage everyone.
    """
    if not is_super_admin(admin_user):
        return False
    return True

def can_override_quiz_ownership(user: User) -> bool:
    """
    Determine if user can access/edit quizzes they don't own.
    Only Super Admin can do this.
    """
    return is_super_admin(user)
