"""
Debug script to simulate frontend quiz save request EXACTLY as it happens in the browser
"""
import requests
import json

API_URL = "http://127.0.0.1:8000/api/v1"
EMAIL = "mohamedmma612@gmail.com"
PASSWORD = "mohamedmma612"

def debug_quiz_save():
    print("="*80)
    print("🔍 DEBUG: محاكاة طلب حفظ الاختبار تماماً كما في المتصفح")
    print("="*80)
    
    # Step 1: Login
    print("\n📝 Step 1: تسجيل الدخول...")
    login_response = requests.post(
        f"{API_URL}/auth/login",
        data={"username": EMAIL, "password": PASSWORD}
    )
    
    if login_response.status_code != 200:
        print(f"❌ فشل تسجيل الدخول: {login_response.status_code}")
        print(f"Response: {login_response.text}")
        return
    
    token = login_response.json()["access_token"]
    print(f"✅ تم الحصول على Token")
    
    # Step 2: Prepare quiz data EXACTLY as frontend sends it
    print("\n📝 Step 2: إعداد البيانات كما يرسلها الفرونت إند...")
    
    # This matches the exact structure from CreateQuiz.jsx saveQuiz function
    quiz_data = {
        "title": "hello",
        "description": "",
        "is_public": True,
        "questions": [
            {
                "text": "hello",
                "question_type": "multiple_choice",
                "points": 10,
                "time_limit": 20,
                "choices": [
                    {"text": "hello", "is_correct": True},
                    {"text": "hello", "is_correct": False},
                    {"text": "go", "is_correct": False}
                ]
            }
        ]
    }
    
    print(f"📦 البيانات المُرسلة:")
    print(json.dumps(quiz_data, ensure_ascii=False, indent=2))
    
    # Step 3: Send request EXACTLY as frontend does
    print("\n📝 Step 3: إرسال الطلب...")
    
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {token}"
    }
    
    try:
        response = requests.post(
            "http://127.0.0.1:8000/api/v1/quizzes/",
            headers=headers,
            json=quiz_data,
            timeout=30
        )
        
        print(f"\n📊 الاستجابة:")
        print(f"Status Code: {response.status_code}")
        print(f"Headers: {dict(response.headers)}")
        
        # Try to parse response
        try:
            response_json = response.json()
            print(f"\n✅ Response Body:")
            print(json.dumps(response_json, ensure_ascii=False, indent=2))
        except:
            print(f"\n⚠️ Response Body (not JSON):")
            print(response.text)
        
        if response.status_code == 201:
            print("\n" + "="*80)
            print("✅ نجح! Quiz saved successfully!")
            print("="*80)
        else:
            print("\n" + "="*80)
            print("❌ فشل! Error saving quiz")
            print("="*80)
            
    except requests.exceptions.RequestException as e:
        print(f"\n❌ خطأ في الاتصال:")
        print(f"Exception Type: {type(e).__name__}")
        print(f"Exception Message: {str(e)}")
        
        if hasattr(e, 'response') and e.response is not None:
            print(f"\nResponse Status: {e.response.status_code}")
            print(f"Response Body: {e.response.text}")
    
    except Exception as e:
        print(f"\n❌ خطأ غير متوقع:")
        print(f"Exception Type: {type(e).__name__}")
        print(f"Exception Message: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    debug_quiz_save()
