
import requests

API_URL = "http://127.0.0.1:8000/api/v1"
EMAIL = "mohamedmma612@gmail.com"
PASSWORD = "mohamedmma612"

def main():
    # 1. Login
    print("Logging in...")
    resp = requests.post(f"{API_URL}/auth/login", data={"username": EMAIL, "password": PASSWORD})
    if resp.status_code != 200:
        print(f"Login failed: {resp.text}")
        return
    token = resp.json()["access_token"]
    print("Logged in successfully.")

    # 2. Get Quiz
    quiz_id = 29
    print(f"Fetching Quiz {quiz_id}...")
    headers = {"Authorization": f"Bearer {token}"}
    resp = requests.get(f"{API_URL}/quizzes/{quiz_id}", headers=headers)
    
    if resp.status_code == 200:
        data = resp.json()
        print(f"Quiz Title: {data.get('title')}")
        questions = data.get("questions", [])
        print(f"Questions Count in Response: {len(questions)}")
        for q in questions:
            print(f" - Q: {q.get('text')} (Choices: {len(q.get('choices', []))})")
    else:
        print(f"Fetch failed: {resp.status_code} - {resp.text}")

if __name__ == "__main__":
    main()
