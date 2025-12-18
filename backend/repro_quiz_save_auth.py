
import asyncio
import httpx
import json
import random
import string

API_URL = "http://127.0.0.1:8000/api/v1"

def random_string(length=10):
    return ''.join(random.choices(string.ascii_letters, k=length))

async def test_create_quiz_auth():
    async with httpx.AsyncClient() as client:
        # 1. Register a new user
        email = f"user_{random_string()}@example.com"
        password = "password123"
        print(f"Registering user: {email}")
        
        reg_payload = {
            "email": email,
            "password": password,
            "full_name": "Test User",
            "role": "teacher"
        }
        
        resp = await client.post(f"{API_URL}/auth/register", json=reg_payload)
        if resp.status_code != 201:
            print(f"Registration failed: {resp.status_code} {resp.text}")
            return

        # 2. Login
        print("Logging in...")
        login_data = {
            "username": email,
            "password": password
        }
        resp = await client.post(f"{API_URL}/auth/login", data=login_data)
        if resp.status_code != 200:
            print(f"Login failed: {resp.status_code} {resp.text}")
            return
            
        token = resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        print("Got token.")

        # 3. Create Quiz
        quiz_payload = {
            "title": "Authenticated Quiz",
            "description": "Created with verified auth",
            "is_public": True,
            "questions": [
                {
                    "text": "Is this working?",
                    "question_type": "multiple_choice",
                    "points": 10,
                    "time_limit": 30,
                    "choices": [
                        {"text": "Yes", "is_correct": True},
                        {"text": "No", "is_correct": False}
                    ]
                }
            ]
        }
        
        print(f"Creating quiz with token...")
        resp = await client.post(f"{API_URL}/quizzes/", json=quiz_payload, headers=headers)
        print(f"Status: {resp.status_code}")
        print(f"Response: {resp.text}")

if __name__ == "__main__":
    asyncio.run(test_create_quiz_auth())
