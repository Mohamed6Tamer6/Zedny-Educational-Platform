"""
=============================================================================
Zedny Platform - Admin Management Utility
=============================================================================
This script provides a unified interface for administrative tasks:
1. Ensuring the SUPER_ADMIN role exists in the database.
2. Creating or updating the platform's root Super Admin account.
3. Resetting admin credentials safely.

Usage:
    python manage_admin.py

Author: Zedny Development Team
=============================================================================
"""
import asyncio
import sys
import os

# Ensure backend directory is in python path
backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from sqlalchemy import text, select
from app.db.session import AsyncSessionLocal
from app.models.user import User, UserRole
from app.core.security import get_password_hash

async def setup_admin():
    print("🚀 Initializing Admin Management Utility...")
    
    # 1. Update Database Schema for SUPER_ADMIN
    async with AsyncSessionLocal() as db:
        try:
            print("Step 1: Checking database ENUM types...")
            # For PostgreSQL, we ensure the SUPER_ADMIN value exists in the UserRole enum
            await db.execute(text("ALTER TYPE userrole ADD VALUE IF NOT EXISTS 'SUPER_ADMIN'"))
            await db.commit()
            print("✅ Database enum updated successfully.")
        except Exception as e:
            print(f"ℹ️ Enum update skipped (Typical for SQLite or already updated): {e}")
            await db.rollback()

    # 2. Setup Super User Account
    async with AsyncSessionLocal() as db:
        print("\nStep 2: Configuring Super Admin account...")
        email = "mohamedmma612@gmail.com"
        password = "mohamedmma612"
        
        result = await db.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()
        
        if user:
            print(f"Found existing user: {email}")
            print(f"Current Role: {user.role} -> Upgrading to SUPER_ADMIN")
            user.role = UserRole.SUPER_ADMIN
            user.hashed_password = get_password_hash(password)
            user.is_active = True
            user.is_verified = True
            db.add(user)
            print("✅ Account updated and privileges escalated.")
        else:
            print(f"User {email} not found. Creating fresh account...")
            user = User(
                email=email,
                hashed_password=get_password_hash(password),
                full_name="Zedny Super Admin",
                role=UserRole.SUPER_ADMIN,
                is_active=True,
                is_verified=True
            )
            db.add(user)
            print("✅ Fresh Super Admin account created.")
            
        await db.commit()
        print("\n🎉 Setup complete! You can now log in at http://localhost:5173/login")

if __name__ == "__main__":
    if sys.platform == "win32":
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    
    try:
        asyncio.run(setup_admin())
    except KeyboardInterrupt:
        print("\nOperation cancelled by user.")
    except Exception as e:
        print(f"\n❌ CRITICAL ERROR: {e}")
