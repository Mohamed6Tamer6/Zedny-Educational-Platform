
import asyncio
from sqlalchemy import select
from app.db.session import AsyncSessionLocal
from app.models.user import User
from app.models.quiz import Quiz, Question

async def main():
    async with AsyncSessionLocal() as db:
        print("\n--- Users ---")
        result = await db.execute(select(User))
        users = result.scalars().all()
        for u in users:
            print(f"User: {u.email}, Role: {u.role}, ID: {u.id}")
            
        print("\n--- Quizzes ---")
        result = await db.execute(select(Quiz))
        quizzes = result.scalars().all()
        for q in quizzes:
            print(f"Quiz: {q.title} (ID: {q.id}), Teacher: {q.teacher_id}")
            # Check questions count directly
            q_res = await db.execute(select(Question).where(Question.quiz_id == q.id))
            questions = q_res.scalars().all()
            print(f"  -> Questions count in DB: {len(questions)}")
            
if __name__ == "__main__":
    asyncio.run(main())
