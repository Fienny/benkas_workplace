# Local Development Setup

## Prerequisites

- Python 3.12+
- Node.js 20+
- Docker + Docker Compose (for PostgreSQL)

---

## 1. Start the database

```bash
docker compose up -d db
```

Postgres will be available at `localhost:5432`.
- DB: `benka_workbench`
- User: `postgres`
- Password: `postgres`

---

## 2. Backend setup

```bash
cd backend

# Copy and configure environment
cp .env.example .env
# Edit .env — at minimum change SECRET_KEY to something random

# Install dependencies
pip install -r requirements.txt

# Seed demo data (creates users + 8 sample projects)
python -m app.seed

# Run the dev server
uvicorn app.main:app --reload --port 8000
```

Backend will be at: http://localhost:8000  
Swagger docs: http://localhost:8000/docs

### `.env` reference

| Variable                     | Default                                            | Notes                     |
|------------------------------|----------------------------------------------------|---------------------------|
| `APP_NAME`                   | Benka Workbench API                                |                           |
| `APP_ENV`                    | development                                        |                           |
| `SECRET_KEY`                 | change-me-super-secret                             | **Change before prod**    |
| `ACCESS_TOKEN_EXPIRE_MINUTES`| 1440                                               | 24 hours                  |
| `DATABASE_URL`               | postgresql+psycopg://postgres:postgres@localhost/… |                           |
| `STORAGE_PATH`               | storage                                            | Relative to backend root  |
| `CORS_ORIGINS`               | http://localhost:3000,…                            |                           |

---

## 3. Frontend setup

```bash
cd frontend
npm install
npm run dev
```

Frontend will be at: http://localhost:3000

The app auto-logs in as `admin@benka.local` / `Admin123!` on first load.

---

## 4. Reseed the database

If you need to reset to a clean state:

```bash
# Drop and recreate the database via Docker
docker compose down -v        # removes pg_data volume
docker compose up -d db
cd backend && python -m app.seed
```

---

## 5. Useful commands

```bash
# Check backend logs
uvicorn app.main:app --reload --log-level debug

# Run TypeScript type check
cd frontend && npx tsc --noEmit

# Build frontend for production preview
cd frontend && npm run build && npm run preview
```

---

## Seed accounts

| Role  | Email             | Password  |
|-------|-------------------|-----------|
| Admin | admin@benka.local | Admin123! |
| User  | user@benka.local  | User123!  |
