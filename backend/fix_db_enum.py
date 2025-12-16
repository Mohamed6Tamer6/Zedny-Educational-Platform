import asyncio
import asyncpg
from app.core.config import get_settings

settings = get_settings()

# Parse DB URL to get connection details
# URL: postgresql+asyncpg://user:password@localhost:5432/zedny_db
# We need to strip the driver part for asyncpg direct connection usually, or parse it.
# Simple parsing:
db_url = settings.DATABASE_URL.replace("postgresql+asyncpg://", "postgresql://")

async def fix_enum():
    print(f"Connecting to {db_url}...")
    try:
        conn = await asyncpg.connect(db_url)
        print("Connected.")
        
        # Check if value exists (optional, but 'ADD VALUE IF NOT EXISTS' syntax is newer/safer)
        # Standard Postgres: ALTER TYPE name ADD VALUE 'new_value';
        # Note: This cannot be run inside a transaction block usually, but asyncpg might handle it.
        try:
            await conn.execute("ALTER TYPE questiontype ADD VALUE 'multiple_select';")
            print("Successfully added 'multiple_select' to questiontype enum.")
        except asyncpg.exceptions.DuplicateObjectError:
            print("'multiple_select' already exists in enum.")
        except Exception as e:
            print(f"Error altering type: {e}")
            
        await conn.close()
    except Exception as e:
        print(f"Connection failed: {e}")

if __name__ == "__main__":
    asyncio.run(fix_enum())
