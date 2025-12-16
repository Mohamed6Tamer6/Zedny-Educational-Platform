"""
Test script for AI Question Generation API
"""
import requests
import os

# Configuration
API_URL = "http://127.0.0.1:8000/api/v1"
EMAIL = "mohamedmma612@gmail.com"
PASSWORD = "mohamedmma612"
PDF_PATH = "test_content_large.pdf"

def test_ai_generation():
    print("=== Starting AI Generation Test ===\n")
    
    # Step 1: Login
    print("1. Logging in...")
    login_response = requests.post(
        f"{API_URL}/auth/login",
        data={"username": EMAIL, "password": PASSWORD}
    )
    
    if login_response.status_code != 200:
        print(f"❌ Login failed: {login_response.status_code}")
        print(login_response.text)
        return False
    
    token = login_response.json()["access_token"]
    print("✅ Login successful")
    print(f"Token: {token[:20]}...\n")
    
    # Step 2: Check if PDF exists
    if not os.path.exists(PDF_PATH):
        print(f"❌ PDF file not found: {PDF_PATH}")
        return False
    
    print(f"2. Found PDF: {PDF_PATH}")
    file_size = os.path.getsize(PDF_PATH)
    print(f"   Size: {file_size} bytes\n")
    
    # Step 3: Generate questions from PDF
    print("3. Sending PDF to AI generation endpoint...")
    print("   Parameters: num_questions=5, difficulty=medium\n")
    
    with open(PDF_PATH, 'rb') as pdf_file:
        files = {'pdf_file': pdf_file}
        data = {
            'num_questions': '5',
            'difficulty': 'medium'
        }
        headers = {'Authorization': f'Bearer {token}'}
        
        generate_response = requests.post(
            f"{API_URL}/generate/from-pdf",
            files=files,
            data=data,
            headers=headers
        )
    
    print(f"Response status: {generate_response.status_code}")
    
    if generate_response.status_code == 200:
        result = generate_response.json()
        print(f"✅ Generation successful!")
        print(f"   Success: {result.get('success')}")
        print(f"   Message: {result.get('message')}")
        print(f"   Questions generated: {len(result.get('questions', []))}\n")
        
        print("Generated Questions:")
        for i, q in enumerate(result.get('questions', []), 1):
            print(f"\n{i}. {q.get('text', 'No text')}")
            for j, choice in enumerate(q.get('choices', []), 1):
                correct = "✓" if choice.get('is_correct') else " "
                print(f"   [{correct}] {choice.get('text', 'No choice')}")
        
        return True
    else:
        print(f"❌ Generation failed!")
        print(f"Status code: {generate_response.status_code}")
        print(f"Response: {generate_response.text}")
        return False

def test_quiz_creation():
    print("\n=== Starting Manual Quiz Creation Test ===\n")
    
    # Login first
    login_response = requests.post(f"{API_URL}/auth/login", data={"username": EMAIL, "password": PASSWORD})
    token = login_response.json()["access_token"]
    headers = {'Authorization': f'Bearer {token}'}

    # Payload matching the new frontend structure
    quiz_payload = {
        "title": "Manual Test Quiz",
        "description": "Created via API test",
        "is_public": True,
        "questions": [
            {
                "text": "What is Python?",
                "question_type": "multiple_choice",
                "points": 10,
                "time_limit": 30,
                "choices": [
                    {"text": "A snake", "is_correct": False},
                    {"text": "A programming language", "is_correct": True},
                    {"text": "A car", "is_correct": False},
                    {"text": "A planet", "is_correct": False}
                ]
            }
        ]
    }

    print("1. Creating quiz with nested questions...")
    response = requests.post(f"{API_URL}/quizzes/", json=quiz_payload, headers=headers)
    
    if response.status_code != 201:
        print(f"❌ Creation failed: {response.status_code}")
        print(response.text)
        return False
        
    data = response.json()
    quiz_id = data['id']
    print(f"✅ Quiz created with ID: {quiz_id}")
    
    # Verify questions were saved
    print("2. Verifying questions persistence...")
    get_response = requests.get(f"{API_URL}/quizzes/{quiz_id}", headers=headers)
    quiz_data = get_response.json()
    
    questions = quiz_data.get('questions', [])
    if len(questions) == 1 and questions[0]['text'] == "What is Python?":
        print(f"✅ Questions saved correctly! Found {len(questions)} question.")
        return True
    else:
        print(f"❌ Questions NOT saved. Found: {len(questions)}")
        return False

if __name__ == "__main__":
    success_ai = test_ai_generation()
    success_quiz = test_quiz_creation()
    
    print("\n" + "="*50)
    if success_ai and success_quiz:
        print("ALL TESTS PASSED ✅")
    else:
        print("SOME TESTS FAILED ❌")
    print("="*50)
