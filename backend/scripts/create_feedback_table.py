import asyncio
import sys
import os

# Add backend to sys.path
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.db.session import engine, Base
from app.models.course import CourseFeedback # Import to ensure it's registered with Base

async def create_feedback_table():
    print("Ensuring course_feedback table exists...")
    async with engine.begin() as conn:
        try:
            # This will create all tables registered with Base that don't exist yet
            await conn.run_sync(Base.metadata.create_all)
            print("Successfully ensured tables exist.")
        except Exception as e:
            print(f"Error creating table: {e}")

if __name__ == "__main__":
    asyncio.run(create_feedback_table())
