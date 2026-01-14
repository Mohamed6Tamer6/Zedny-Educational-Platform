# Zedny Backend - Project Structure

## 📁 Directory Organization

```
backend/
├── 📂 alembic/              # Database migrations
│   ├── versions/            # Migration files
│   ├── env.py              # Alembic environment
│   └── script.py.mako      # Migration template
│
├── 📂 app/                  # Main application code
│   ├── 📂 api/             # API endpoints
│   │   ├── deps.py         # Dependencies (auth, etc.)
│   │   └── v1/             # API version 1
│   │       ├── api.py      # Router aggregation
│   │       └── endpoints/  # Individual endpoints
│   │           ├── auth.py
│   │           ├── quizzes.py
│   │           ├── courses.py
│   │           ├── admin.py
│   │           ├── generate.py
│   │           ├── uploads.py
│   │           └── health.py
│   │
│   ├── 📂 core/            # Core functionality
│   │   ├── config.py       # Configuration
│   │   ├── security.py     # Password hashing, JWT
│   │   └── super_admin.py  # Super admin utilities
│   │
│   ├── 📂 db/              # Database setup
│   │   ├── session.py      # DB session & engine
│   │   └── __init__.py
│   │
│   ├── 📂 models/          # SQLAlchemy models
│   │   ├── user.py         # User model
│   │   ├── quiz.py         # Quiz models
│   │   ├── course.py       # Course/LMS models
│   │   └── __init__.py
│   │
│   ├── 📂 schemas/         # Pydantic schemas
│   │   ├── user.py         # User schemas
│   │   ├── quiz.py         # Quiz schemas
│   │   ├── course.py       # Course schemas
│   │   ├── admin.py        # Admin schemas
│   │   └── __init__.py
│   │
│   ├── 📂 services/        # Business logic
│   │   ├── question_generator.py  # AI question generation
│   │   └── __init__.py
│   │
│   └── main.py             # FastAPI application
│
├── 📂 docs/                # Documentation
│   ├── DATABASE_ARCHITECTURE.md
│   ├── IMPROVEMENTS.md
│   ├── IMPROVEMENTS_QUICKSTART.md
│   ├── IMPROVEMENTS_SUMMARY_AR.md
│   └── README.md
│
├── 📂 scripts/             # Utility scripts
│   ├── apply_improvements.py
│   ├── verify_improvements.py
│   ├── manage_admin.py
│   ├── kill_and_run.ps1
│   └── README.md
│
├── 📂 uploads/             # User uploaded files
│   ├── .gitkeep
│   └── .gitignore
│
├── 📂 venv/                # Virtual environment
│
├── .env                    # Environment variables (not in git)
├── .env.example            # Environment template
├── .gitignore              # Git ignore rules
├── alembic.ini             # Alembic configuration
├── requirements.txt        # Python dependencies
├── run.py                  # Application entry point
├── start_server.bat        # Windows startup script
├── start_server.ps1        # PowerShell startup script
├── README_START.md         # Getting started guide
└── PROJECT_STRUCTURE.md    # This file
```

## 🎯 Key Files

### Entry Points:
- `run.py` - Main application entry point
- `app/main.py` - FastAPI application setup

### Configuration:
- `.env` - Environment variables (DATABASE_URL, SECRET_KEY, etc.)
- `alembic.ini` - Database migration configuration
- `requirements.txt` - Python package dependencies

### Database:
- `app/db/session.py` - Database connection and session management
- `app/models/` - Database models (SQLAlchemy ORM)
- `alembic/versions/` - Database migration history

### API:
- `app/api/v1/endpoints/` - REST API endpoints
- `app/schemas/` - Request/response validation (Pydantic)

## 🚀 Quick Start

1. **Setup Environment:**
   ```bash
   python -m venv venv
   .\venv\Scripts\activate
   pip install -r requirements.txt
   ```

2. **Configure Database:**
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials
   ```

3. **Run Migrations:**
   ```bash
   alembic upgrade head
   ```

4. **Create Admin:**
   ```bash
   python scripts/manage_admin.py
   ```

5. **Start Server:**
   ```bash
   python run.py
   # or
   .\start_server.bat
   ```

## 📚 Documentation

- See `docs/` directory for complete documentation
- Start with `docs/DATABASE_ARCHITECTURE.md`

## 🔧 Maintenance

```bash
# Apply database improvements
python scripts/apply_improvements.py

# Verify improvements
python scripts/verify_improvements.py

# Create new migration
alembic revision -m "description"

# Apply migrations
alembic upgrade head
```

## 📦 Uploads

- All user uploads go to `backend/uploads/`
- Served via `/uploads/` endpoint
- Configured in `app/main.py`

---

*Last Updated: 2026-01-07*
