# How to Run the Server

## Recommended Method (Easiest):

### On Windows:
1. **Use the Batch file:**
   - Double-click on `start_server.bat`
   - Or from the terminal:
     ```cmd
     start_server.bat
     ```

2. **Or use PowerShell:**
   ```powershell
   .\start_server.ps1
   ```

3. **Or use Python directly:**
   ```bash
   cd backend
   venv\Scripts\activate
   python run.py
   ```

## Manual Method (Optional):

```bash
cd backend
venv\Scripts\activate
python -m uvicorn app.main:app --reload
```

**Note:** You must be inside the `backend` folder when running the command.

---

## After Running:

- The server will run on: **http://127.0.0.1:8000**
- API Documentation interface: **http://127.0.0.1:8000/docs**
- Main Page: **http://127.0.0.1:8000/**

---

## Troubleshooting:

If the error `ModuleNotFoundError: No module named 'app'` appears:
- Make sure you are inside the `backend` folder.
- Use `run.py` or `start_server.bat` instead of the direct command.
