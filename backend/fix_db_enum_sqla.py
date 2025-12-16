import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
from app.core.config import get_settings

settings = get_settings()

async def fix_enum():
    # Use isolation_level="AUTOCOMMIT" to allow ALTER TYPE
    engine = create_async_engine(settings.DATABASE_URL, execution_options={"isolation_level": "AUTOCOMMIT"})
    print(f"Connecting to DB...")
    
    async with engine.connect() as conn:
        try:
            print("Attempting to add 'MULTIPLE_SELECT' to questiontype...")
            await conn.execute(text("ALTER TYPE questiontype ADD VALUE 'MULTIPLE_SELECT';"))
            print("Success!")
        except Exception as e:
            print(f"Error (might be duplicate): {e}")

    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(fix_enum())
