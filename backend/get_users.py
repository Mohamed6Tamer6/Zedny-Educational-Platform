
import asyncio
from sqlalchemy import select
from app.db.session import AsyncSessionLocal
from app.models.user import User

async def main():
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(User))
        users = result.scalars().all()
        for u in users:
            print(f"EMAIL: {u.email}  PASSWORD: (hash)")
            
if __name__ == "__main__":
    asyncio.run(main())
