import asyncio
import httpx

API_URL = "http://127.0.0.1:8000/api/v1"

async def main():
    async with httpx.AsyncClient() as client:
        # 1. Login
        login_data = {"username": "teacher@example.com", "password": "password123"}
        # Register if needed (ignoring error)
        await client.post(f"{API_URL}/auth/register", json={
            "email": "teacher@example.com", "password": "password123", "full_name": "Teacher", "role": "teacher"
        })
        
        resp = await client.post(f"{API_URL}/auth/login", data=login_data)
        if resp.status_code != 200:
            print("Login failed, skipping test")
            return
        token = resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 2. Create Quiz with Multiple Select
        quiz_data = {
            "title": "Multi Select Test",
            "is_public": True,
            "questions": [
                {
                    "text": "Select all correct colors",
                    "question_type": "multiple_select",
                    "points": 10,
                    "time_limit": 20,
                    "choices": [
                        {"text": "Red", "is_correct": True},
                        {"text": "Blue", "is_correct": True},
                        {"text": "Yellow (Wrong)", "is_correct": False}
                    ]
                }
            ]
        }
        
        print("Sending request...")
        resp = await client.post(f"{API_URL}/quizzes/", json=quiz_data, headers=headers)
        print(f"Status: {resp.status_code}")
        print(f"Response: {resp.text}")

if __name__ == "__main__":
    asyncio.run(main())
