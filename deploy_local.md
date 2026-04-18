# Local Development Setup

Two terminal windows — one for the backend, one for the frontend.

No Docker required for local dev. The app uses SQLite by default.

---

## Prerequisites

- Python 3.12+ — `python --version`
- Node.js 20+ — `node --version`
- Git — `git --version`

---

## Step 0 — Pull the latest code

```bash
git fetch origin
git checkout claude/finish-dashboard-wJqb0
git pull origin claude/finish-dashboard-wJqb0
```

---

## Step 1 — Create the backend `.env` file

Create `backend/.env` (this file is gitignored — create it manually once).

**Option A — local filesystem storage (no Wasabi needed):**

```env
APP_ENV=development
SECRET_KEY=dev-secret-key-change-in-production
DATABASE_URL=sqlite:///./benka.db
STORAGE_PATH=storage
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000
```

Uploaded files are saved to `backend/storage/`. Fine for quick testing.

**Option B — Wasabi S3 storage (matches production):**

```env
APP_ENV=development
SECRET_KEY=dev-secret-key-change-in-production
DATABASE_URL=sqlite:///./benka.db
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000

WASABI_BUCKET=your-bucket-name
WASABI_ENDPOINT=https://s3.wasabisys.com
WASABI_ACCESS_KEY=your-access-key
WASABI_SECRET_KEY=your-secret-key
WASABI_REGION=us-east-1
```

When `WASABI_BUCKET` is set, all uploads go to Wasabi and downloads redirect to a 1-hour presigned URL. Use this to test the full production flow locally.

---

## Step 2 — Backend (Terminal 1)

```bash
cd backend

# First time only — install Python packages
pip install -r requirements.txt

# Seed demo users and 8 sample projects (safe to re-run)
python -m app.seed

# Start the API server
uvicorn app.main:app --reload --port 8000
```

You should see:
```
Application startup complete.
Uvicorn running on http://127.0.0.1:8000
```

Leave this terminal open. Swagger UI: http://localhost:8000/docs

---

## Step 3 — Frontend (Terminal 2)

```bash
cd frontend

# First time only — install npm packages
npm install

# Start the dev server
npm run dev
```

You should see:
```
  VITE ready in Xms
  ➜  Local: http://localhost:5173/
```

Open http://localhost:5173 in your browser.

---

## Seed credentials

| Role  | Username | Password |
|-------|----------|----------|
| Admin | admin    | admin    |
| User  | user     | user     |

---

## Troubleshooting

### Login page shows "Cannot reach the backend"

1. **Is uvicorn running?**
   Terminal 1 must show `Application startup complete.`
   If it crashed, restart: `uvicorn app.main:app --reload --port 8000`

2. **Is port 8000 in use?**
   ```bash
   # Linux / macOS
   lsof -i :8000
   # Windows
   netstat -ano | findstr :8000
   ```
   Stop whatever is on port 8000, or change the port in both uvicorn and `frontend/vite.config.ts`.

3. **Did you seed?**
   ```bash
   cd backend && python -m app.seed
   ```

### "Wrong username or password"

Re-run the seed:
```bash
cd backend && python -m app.seed
```

### Admin Panel shows empty / 500 error

The database is probably missing a table added in a later session. Reset:
```bash
# From backend/
rm -f benka.db
python -m app.seed
```

### Reset everything (nuclear option)

```bash
cd backend
rm -f benka.db
python -m app.seed
uvicorn app.main:app --reload --port 8000
```

---

## `.env` reference

| Variable           | Default value                                     | Notes                            |
|--------------------|---------------------------------------------------|----------------------------------|
| `APP_ENV`          | `development`                                     |                                  |
| `SECRET_KEY`       | `dev-secret-key-change-in-production`             | Change before prod!              |
| `DATABASE_URL`     | `sqlite:///./benka.db`                            | SQLite (local) or PostgreSQL URL |
| `STORAGE_PATH`     | `storage`                                         | Used only when WASABI_BUCKET unset |
| `CORS_ORIGINS`     | `http://localhost:5173,...`                       | Comma-separated                  |
| `WASABI_BUCKET`    | _(empty — local filesystem)_                      | Set to enable S3 storage         |
| `WASABI_ENDPOINT`  | `https://s3.wasabisys.com`                        | Change for your Wasabi region    |
| `WASABI_ACCESS_KEY`| _(empty)_                                         | From Wasabi Console → Access Keys|
| `WASABI_SECRET_KEY`| _(empty)_                                         |                                  |
| `WASABI_REGION`    | `us-east-1`                                       |                                  |
