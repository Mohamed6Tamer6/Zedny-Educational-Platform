
import asyncio
import sys
from sqlalchemy import text, select
from app.db.session import AsyncSessionLocal
from app.models.user import User, UserRole
from app.core.security import get_password_hash

async def ensure_superuser():
    # First, try to add SUPER_ADMIN to the enum if it's Postgres
    async with AsyncSessionLocal() as db:
        try:
            print("Attempting to add SUPER_ADMIN to enum type...")
            # We need to execute this outside of a transaction or commited immediately
            # But AsyncSession starts a transaction.
            await db.execute(text("ALTER TYPE userrole ADD VALUE IF NOT EXISTS 'SUPER_ADMIN'"))
            await db.commit()
            print("Enum updated.")
        except Exception as e:
            print(f"Enum update skipped or failed (might be SQLite or already exists): {e}")
            await db.rollback()

    async with AsyncSessionLocal() as db:
        print("Checking for superuser...")
        email = "mohamedmma612@gmail.com"
        password = "mohamedmma612"
        
        result = await db.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()
        
        if user:
            print(f"User {email} found. Role: {user.role}. Updating to SUPER_ADMIN.")
            user.role = UserRole.SUPER_ADMIN
            user.hashed_password = get_password_hash(password)
            user.is_active = True
            db.add(user)
        else:
            print(f"User {email} not found. Creating SUPER_ADMIN.")
            user = User(
                email=email,
                hashed_password=get_password_hash(password),
                full_name="Super Admin",
                role=UserRole.SUPER_ADMIN,
                is_active=True,
                is_verified=True
            )
            db.add(user)
            
        await db.commit()
        print("Superuser ensured successfully.")

if __name__ == "__main__":
    if sys.platform == "win32":
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(ensure_superuser())
