# Benka's Workbench

Engineering project dashboard — track project status, progress, and file attachments.

## Stack

| Layer     | Technology                           |
|-----------|--------------------------------------|
| Frontend  | React 18, TypeScript, Vite, Recharts |
| Backend   | FastAPI, SQLAlchemy 2, Pydantic      |
| Auth      | JWT (HS256), bcrypt                  |
| Database  | PostgreSQL 16                        |
| Container | Docker, Docker Compose               |

## Features

- Dashboard with 6 KPI cards and 4 charts (pie, bar, line, horizontal bar)
- Projects table with color-coded status chips and visual progress bars
- File management per project — upload, download, delete via modal
- JWT-protected API with role-based access (admin / user)
- Sidebar shows real logged-in user with correct initials and role

## Quick Start

See [`deploy_local.md`](./deploy_local.md) for the full local dev setup.

**Short version:**
```bash
# 1. Start the database
docker compose up -d db

# 2. Backend
cd backend
cp .env.example .env          # update SECRET_KEY before production
pip install -r requirements.txt
python -m app.seed            # creates demo users + 8 sample projects
uvicorn app.main:app --reload

# 3. Frontend (separate terminal)
cd ../frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — the app auto-logs in as `admin@benka.local`.

## Seed Credentials

| Role  | Email             | Password  |
|-------|-------------------|-----------|
| Admin | admin@benka.local | Admin123! |
| User  | user@benka.local  | User123!  |

## API Docs

Interactive Swagger UI at [http://localhost:8000/docs](http://localhost:8000/docs)

## Key Endpoints

```
POST   /api/v1/auth/login
POST   /api/v1/auth/register
GET    /api/v1/users/me

GET    /api/v1/projects
POST   /api/v1/projects           (admin)
PATCH  /api/v1/projects/{id}      (admin)
DELETE /api/v1/projects/{id}      (admin)

GET    /api/v1/files/project/{id}
POST   /api/v1/files/project/{id}
GET    /api/v1/files/{id}/download
DELETE /api/v1/files/{id}

GET    /api/v1/dashboard
GET    /health
```

## Project Structure

```
benkas_worplace/
├── backend/
│   └── app/
│       ├── api/          # Route handlers
│       ├── core/         # Config, JWT security
│       ├── db/           # SQLAlchemy engine & session
│       ├── models/       # User, Project, ProjectFile
│       ├── schemas/      # Pydantic request/response models
│       ├── services/     # Local file storage
│       └── seed.py       # Demo data seeder
├── frontend/
│   └── src/
│       ├── api/          # Axios wrappers (auth, projects, files, users)
│       ├── components/   # StatCard, ChartCard, ProjectTable, FileManager
│       ├── layouts/      # MainLayout (sidebar + content shell)
│       ├── pages/        # DashboardPage, ProjectsPage
│       ├── styles/       # global.css
│       └── types/        # TypeScript interfaces
├── docker-compose.yml
├── CLAUDE.md             # Agent session log
├── deploy_local.md
└── deploy_server.md
```

## Next Steps (backlog)

1. Alembic migrations instead of `create_all`
2. S3 / MinIO storage instead of local filesystem
3. Login page (remove auto-login)
4. Admin UI: create/edit/delete projects from the browser
5. Nginx + full Docker Compose for production
6. Audit log table for user actions
