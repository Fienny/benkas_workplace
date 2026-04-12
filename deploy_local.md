# Local Development Setup

**Use two PowerShell / terminal windows** — one for the backend, one for the frontend.

---

## Prerequisites

- Python 3.12+ — check: `python --version`
- Node.js 20+ — check: `node --version`
- Docker Desktop (running) — check: `docker info`
- Git — check: `git --version`

---

## Step 0 — Pull the latest code

Always pull before starting, especially after someone else has pushed changes.

```powershell
git fetch origin
git checkout claude/finish-dashboard-wJqb0
git pull origin claude/finish-dashboard-wJqb0
```

---

## Step 1 — Start the database (Terminal 1)

Run this from the **project root** (`benka_workbench/`):

```powershell
docker compose up -d db
```

Verify it's running:
```powershell
docker compose ps
```
You should see `db` with status `running` or `healthy`.

---

## Step 2 — Backend (Terminal 1, still in project root)

```powershell
cd backend

# First time only — copy the env file
copy .env.example .env

# First time only — install Python packages
pip install -r requirements.txt

# Seed demo users and projects (safe to run multiple times)
python -m app.seed

# Start the API server
python -m uvicorn app.main:app --reload --port 8000
```

You should see:
```
Application startup complete.
Uvicorn running on http://127.0.0.1:8000
```

Leave this terminal open. Backend is at http://localhost:8000/docs

---

## Step 3 — Frontend (Terminal 2)

Open a **new terminal** in the project root:

```powershell
cd frontend

# First time only — install npm packages
npm install

# Start the dev server
npm run dev
```

You should see:
```
  VITE ready in Xms
  ➜  Local: http://localhost:3000/
```

Open http://localhost:3000 in your browser.

---

## What you should see

1. A brief "Starting…" screen (< 2 seconds)
2. The dashboard with 8 projects and charts

The app auto-logs in as `admin@benka.local`. No manual login needed.

---

## Seed accounts

| Role  | Email             | Password  |
|-------|-------------------|-----------|
| Admin | admin@benka.local | Admin123! |
| User  | user@benka.local  | User123!  |

---

## Troubleshooting

### "Starting…" screen never goes away / error screen appears

The app cannot reach the backend. Check:

1. **Is uvicorn running?**  
   Terminal 1 must show `Application startup complete.`  
   If it crashed, re-run: `python -m uvicorn app.main:app --reload --port 8000`

2. **Is the database running?**  
   ```powershell
   docker compose ps   # should show db as running
   docker compose up -d db   # start it if not
   ```

3. **Is port 8000 in use?** (Windows)
   ```powershell
   netstat -ano | findstr :8000
   ```
   If something else is on 8000, stop it or change the port in both uvicorn and `frontend/src/api/client.ts`.

4. **Did you seed the database?**  
   ```powershell
   cd backend
   python -m app.seed
   ```
   The seed prints status lines. If it prints nothing, you're in the wrong folder or on the wrong branch.

5. **Stale browser token** — Open DevTools (`F12`) → Application → Local Storage → delete `access_token` → reload.

---

### "Login failed" error on screen

Run the seed:
```powershell
cd backend
python -m app.seed
```

If seed prints nothing or errors, reset the database completely:
```powershell
# From project root
docker compose down -v
docker compose up -d db
cd backend
python -m app.seed
```

---

### Reset everything (nuclear option)

```powershell
# From project root — DELETES all data in the database
docker compose down -v
docker compose up -d db
cd backend
python -m app.seed
python -m uvicorn app.main:app --reload --port 8000
```

Then in Terminal 2:
```powershell
cd frontend && npm run dev
```

---

## .env reference

| Variable                      | Default value                                             | Notes                   |
|-------------------------------|-----------------------------------------------------------|-------------------------|
| `APP_NAME`                    | Benka Workbench API                                       |                         |
| `SECRET_KEY`                  | change-me-super-secret                                    | Change before prod!     |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | 1440                                                      | 24 hours                |
| `DATABASE_URL`                | postgresql+psycopg://postgres:postgres@localhost:5432/... |                         |
| `STORAGE_PATH`                | storage                                                   | Relative to backend dir |
| `CORS_ORIGINS`                | http://localhost:3000,...                                 |                         |
