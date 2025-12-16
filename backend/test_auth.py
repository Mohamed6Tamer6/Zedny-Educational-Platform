
import asyncio
import httpx
import json

API_URL = "http://127.0.0.1:8000/api/v1/quizzes/"

payload = {
    "title": "Auth Test Quiz",
    "description": "Should fail if auth is on",
    "is_public": True,
    "questions": [
        {
            "text": "Auth Check?",
            "question_type": "multiple_choice",
            "points": 10,
            "time_limit": 20,
            "choices": [
                {"text": "Yes", "is_correct": True},
                {"text": "No", "is_correct": False}
            ]
        }
    ]
}

async def test_auth():
    print("Testing Auth enforcement...")
    async with httpx.AsyncClient() as client:
        # Request WITHOUT Authorization header
        response = await client.post(API_URL, json=payload)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 401:
            print("PASS: Auth is enforced (401 Unauthorized)")
        elif response.status_code == 201:
            print("FAIL: Auth is NOT enforced (201 Created)")
        else:
            print(f"Unexpected status: {response.status_code}")

if __name__ == "__main__":
    asyncio.run(test_auth())
