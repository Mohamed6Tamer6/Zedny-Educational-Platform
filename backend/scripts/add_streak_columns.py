import asyncio
import sys
import os

# Add backend to sys.path
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from sqlalchemy import text
from app.db.session import engine

async def add_streak_columns():
    print("Adding streak columns to users table...")
    async with engine.begin() as conn:
        try:
            # Check if columns exist first to avoid errors
            check_query = text("SELECT column_name FROM information_schema.columns WHERE table_name='users'")
            result = await conn.execute(check_query)
            existing_columns = [row[0] for row in result.fetchall()]
            
            if 'streak_count' not in existing_columns:
                await conn.execute(text("ALTER TABLE users ADD COLUMN streak_count INTEGER DEFAULT 0"))
                print("Added streak_count column.")
            
            if 'last_streak_date' not in existing_columns:
                await conn.execute(text("ALTER TABLE users ADD COLUMN last_streak_date TIMESTAMP WITH TIME ZONE"))
                print("Added last_streak_date column.")
                
            print("Successfully updated users table.")
        except Exception as e:
            print(f"Error updating table: {e}")

if __name__ == "__main__":
    asyncio.run(add_streak_columns())
