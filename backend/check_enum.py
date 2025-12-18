import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
from app.core.config import get_settings

settings = get_settings()

async def list_enum_values():
    engine = create_async_engine(settings.DATABASE_URL)
    async with engine.connect() as conn:
        result = await conn.execute(text("SELECT enum_range(NULL::questiontype)"))
        row = result.fetchone()
        print(f"Current Enum Values: {row[0]}")
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(list_enum_values())
