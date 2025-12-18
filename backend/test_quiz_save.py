"""
Test script to verify quiz saving functionality
"""
import requests
import json

# Configuration
API_URL = "http://127.0.0.1:8000/api/v1"
TEST_USER_EMAIL = "mohamedmma612@gmail.com"
TEST_USER_PASSWORD = "mohamedmma612"

def test_quiz_creation():
    """Test creating a quiz with the same data structure as the frontend"""
    
    print("="*60)
    print("🧪 اختبار حفظ الاختبار - Quiz Save Test")
    print("="*60)
    
    # Step 1: Login to get token
    print("\n📝 Step 1: تسجيل الدخول...")
    login_response = requests.post(
        f"{API_URL}/auth/login",
        data={
            "username": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD
        }
    )
    
    if login_response.status_code != 200:
        print(f"❌ فشل تسجيل الدخول: {login_response.status_code}")
        print(f"Response: {login_response.text}")
        return False
    
    token = login_response.json()["access_token"]
    print(f"✅ تم تسجيل الدخول بنجاح")
    
    # Step 2: Create a quiz
    print("\n📝 Step 2: إنشاء اختبار جديد...")
    
    quiz_data = {
        "title": "اختبار تجريبي - Test Quiz",
        "description": "",
        "is_public": True,
        "questions": [
            {
                "text": "ما هو عاصمة مصر؟",
                "question_type": "multiple_choice",
                "points": 10,
                "time_limit": 20,
                "choices": [
                    {"text": "القاهرة", "is_correct": True},
                    {"text": "الإسكندرية", "is_correct": False},
                    {"text": "الجيزة", "is_correct": False},
                    {"text": "أسوان", "is_correct": False}
                ]
            },
            {
                "text": "كم عدد الكواكب في المجموعة الشمسية؟",
                "question_type": "multiple_choice",
                "points": 10,
                "time_limit": 20,
                "choices": [
                    {"text": "7", "is_correct": False},
                    {"text": "8", "is_correct": True},
                    {"text": "9", "is_correct": False},
                    {"text": "10", "is_correct": False}
                ]
            }
        ]
    }
    
    print(f"📦 البيانات المرسلة:")
    print(json.dumps(quiz_data, ensure_ascii=False, indent=2))
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    create_response = requests.post(
        f"{API_URL}/quizzes/",
        json=quiz_data,
        headers=headers
    )
    
    print(f"\n📊 الاستجابة:")
    print(f"Status Code: {create_response.status_code}")
    
    if create_response.status_code == 201:
        response_data = create_response.json()
        print(f"✅ تم حفظ الاختبار بنجاح!")
        print(f"   Quiz ID: {response_data['id']}")
        print(f"   Title: {response_data['title']}")
        print(f"   Access Code: {response_data['access_code']}")
        print(f"   Questions Count: {len(response_data.get('questions', []))}")
        
        # Verify questions
        if len(response_data.get('questions', [])) == 2:
            print(f"✅ جميع الأسئلة تم حفظها بشكل صحيح")
            for i, q in enumerate(response_data['questions'], 1):
                print(f"   Q{i}: {q['text']}")
                print(f"      Choices: {len(q.get('choices', []))}")
        else:
            print(f"⚠️ تحذير: عدد الأسئلة المحفوظة غير صحيح")
        
        print("\n" + "="*60)
        print("🎉 الاختبار نجح! Quiz Save Test PASSED!")
        print("="*60)
        return True
    else:
        print(f"❌ فشل حفظ الاختبار!")
        print(f"Response: {create_response.text}")
        
        try:
            error_detail = create_response.json()
            print(f"Error Detail: {json.dumps(error_detail, ensure_ascii=False, indent=2)}")
        except:
            pass
        
        print("\n" + "="*60)
        print("❌ الاختبار فشل! Quiz Save Test FAILED!")
        print("="*60)
        return False

if __name__ == "__main__":
    success = test_quiz_creation()
    exit(0 if success else 1)
