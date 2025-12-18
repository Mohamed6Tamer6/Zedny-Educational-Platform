import asyncio
import sys
import os

# Ensure backend directory is in python path
backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from sqlalchemy.future import select
from app.db.session import AsyncSessionLocal
from app.models.user import User, UserRole
from app.core.security import get_password_hash

async def create_superuser(email, password, full_name):
    print(f"Checking for existing user {email}...")
    async with AsyncSessionLocal() as session:
        try:
            # Check if user exists
            result = await session.execute(select(User).where(User.email == email))
            existing_user = result.scalar_one_or_none()
            
            if existing_user:
                print(f"User {email} already exists.")
                # Update to admin if not already
                if existing_user.role != UserRole.ADMIN:
                    print("Updating user to ADMIN role...")
                    existing_user.role = UserRole.ADMIN
                    existing_user.hashed_password = get_password_hash(password)
                    session.add(existing_user)
                    await session.commit()
                    print("User updated successfully.")
                else:
                    print("User is already an ADMIN.")
            else:
                print(f"Creating new superuser {email}...")
                new_user = User(
                    email=email,
                    hashed_password=get_password_hash(password),
                    full_name=full_name,
                    role=UserRole.ADMIN,
                    is_active=True,
                    is_verified=True
                )
                session.add(new_user)
                await session.commit()
                print("Superuser created successfully!")
                
        except Exception as e:
            print(f"Error: {e}")
            await session.rollback()
        finally:
            await session.close()

if __name__ == "__main__":
    email = "mohamedmma612@gmail.com"
    password = "mohamedmma612"
    full_name = "Super Admin"
    
    if sys.platform == 'win32':
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
        
    asyncio.run(create_superuser(email, password, full_name))
