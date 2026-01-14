import asyncio
import sys
import os

# Add backend to sys.path
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.db.session import engine
from sqlalchemy import text

async def add_target_skills_column():
    print("Adding target_skills column to courses table...")
    async with engine.begin() as conn:
        try:
            # Check if column exists first (SQLite/Postgres compatible)
            await conn.execute(text("ALTER TABLE courses ADD COLUMN IF NOT EXISTS target_skills TEXT"))
            print("Successfully added target_skills column.")
        except Exception as e:
            # For SQLite 'ADD COLUMN IF NOT EXISTS' might not work, but this is Postgres based on previous logs
            print(f"Error adding column: {e}")
            print("Attempting alternative...")
            try:
                await conn.execute(text("ALTER TABLE courses ADD COLUMN target_skills TEXT"))
                print("Successfully added target_skills column (alt).")
            except Exception as e2:
                 print(f"Alternative also failed: {e2}")

if __name__ == "__main__":
    asyncio.run(add_target_skills_column())
