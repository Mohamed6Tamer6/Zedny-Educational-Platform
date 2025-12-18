# كيفية تشغيل السيرفر

## الطريقة الموصى بها (الأسهل):

### على Windows:
1. **استخدم ملف الباتش:**
   - انقر نقراً مزدوجاً على `start_server.bat`
   - أو من التيرمنال:
     ```cmd
     start_server.bat
     ```

2. **أو استخدم PowerShell:**
   ```powershell
   .\start_server.ps1
   ```

3. **أو استخدم Python مباشرة:**
   ```bash
   cd backend
   venv\Scripts\activate
   python run.py
   ```

## الطريقة اليدوية (إذا أردت):

```bash
cd A:\zedny-project\backend
venv\Scripts\activate
python -m uvicorn app.main:app --reload
```

**ملاحظة:** يجب أن تكون داخل مجلد `backend` عند تشغيل الأمر.

---

## بعد التشغيل:

- السيرفر سيعمل على: **http://127.0.0.1:8000**
- واجهة API Documentation: **http://127.0.0.1:8000/docs**
- الصفحة الرئيسية: **http://127.0.0.1:8000/**

---

## حل المشاكل:

إذا ظهر خطأ `ModuleNotFoundError: No module named 'app'`:
- تأكد أنك داخل مجلد `backend`
- استخدم `run.py` أو `start_server.bat` بدلاً من الأمر المباشر




