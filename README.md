# Zedny Educational Platform

## 🌟 Overview
Zedny is an interactive, gamified educational platform designed to modernize the learning experience. It combines the engagement of Kahoot-style quizzes with robust classroom management features. The platform serves two main user roles: **Teachers** who can create dynamic quizzes (manually or via AI) and mange sessions, and **Students** who can join live games, track their progress, and compete on leaderboards.


## 🏗️ Project Structure

The project follows a clean separation of concerns with a backend API and a React frontend.

```
zedny-project/
├── backend/                # FastAPI Application
│   ├── app/
│   │   ├── api/            # API Endpoints (Routes)
│   │   ├── core/           # Config & Security definitions
│   │   ├── db/             # Database connection & models
│   │   ├── models/         # SQLAlchemy Database Models
│   │   ├── schemas/        # Pydantic Schemas for validation
│   │   ├── services/       # Business logic (AI, etc.)
│   │   └── main.py         # App entry point
│   ├── alembic/            # Database migrations
│   ├── .env                # Environment variables
│   └── run.py              # Server runner script
│
├── frontend-react/         # React Frontend (Vite)
│   ├── src/                # React source code
│   ├── index.html          # SPA entry
│   ├── package.json        # Frontend dependencies & scripts
│   └── vite.config.js      # Vite config (dev server + API proxy)
│
├── requirements.txt        # Python dependencies
└── README.md               # Project Documentation
```

## 🚀 How to Run the Project

### Prerequisites
- Python 3.9+
- PostgreSQL
- Node.js (Required for the React frontend)

### 1. Setup Backend
1. Navigate to the `backend` directory.
2. Create virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r ../requirements.txt
   ```
4. Configure Database:
   - Create a PostgreSQL database named `zedny_db`.
   - Update `.env` file with your DB credentials (`DATABASE_URL`).
5. Run Migrations:
   ```bash
   alembic upgrade head
   ```

### 2. Start the Server
You can start the server using the provided helper script:

**Windows (PowerShell):**
```powershell
.\backend\start_server.ps1
```

**Manual:**
```bash
python backend/run.py
```

The server will start at `http://127.0.0.1:8000`.

### 3. Run the React Frontend (Development)
1. Navigate to the React frontend directory:
   ```bash
   cd frontend-react
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the dev server:
   ```bash
   npm run dev
   ```
4. Open the app at `http://localhost:5173`.

The React dev server is configured to proxy API calls to the backend under `/api`.

### 4. Serve React from the Backend (Production-like)
1. Build the React app:
   ```bash
   cd frontend-react
   npm run build
   ```
2. Start the backend (as usual). If `frontend-react/dist` exists, the backend serves the built React SPA at `http://127.0.0.1:8000`.

## �️ Technologies Used

**Backend:**
- **Language:** Python 3.9+
- **Framework:** FastAPI
- **Database:** PostgreSQL
- **ORM:** SQLAlchemy (Async)
- **AI:** Google Gemini API

**Frontend:**
- **Framework:** React
- **Build Tool:** Vite
- **Routing:** react-router-dom
- **Icons:** lucide-react

## 🔮 Future Vision

We are committed to evolving Zedny into a comprehensive educational ecosystem. Our immediate roadmap includes:

- **New Game Modes:** Expanding beyond standard quizzes to include diverse game types.
- **Role-Based Access Control:** Developing dedicated secure portals for **Students** and **Teachers**.

---
