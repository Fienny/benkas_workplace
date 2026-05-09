# Benka's Workbench

Internal engineering project dashboard — track project status, progress, files, and team activity.

## Stack

| Layer     | Technology                                  |
|-----------|---------------------------------------------|
| Frontend  | React 18, TypeScript, Vite, Recharts        |
| Backend   | FastAPI, SQLAlchemy 2, Pydantic             |
| Auth      | Cookie sessions (Starlette SessionMiddleware, bcrypt) |
| Database  | PostgreSQL 16 (prod) / SQLite (local dev)   |
| Container | Docker, Docker Compose                      |
| i18n      | i18next + react-i18next (English / Russian) |

## Features

- **Dashboard** — 6 KPI cards, 4 charts (pie, bar, line, horizontal bar), average progress
- **Projects table** — color-coded status chips, visual progress bars, region badges, file counts
- **Per-project file manager** — click any project row to open a detail page with folder tree, upload, download, delete
- **Folders** — create one-level-deep folders inside each project; files are organized per folder
- **Project lead** — assign any user as lead for a project; leads can delete any file in that project (same as admin)
- **Admin panel** — create users, toggle role (admin/engineer), activate/deactivate, delete
- **Activity log** — full audit trail of all user actions (file uploads, project edits, user management)
- **Role-based access** — admins can do everything; engineers can upload files and edit leads cannot delete projects or manage users
- **Language switcher** — English / Russian, persisted in localStorage

## Quick Start

See [`deploy_local.md`](./deploy_local.md) for the full local dev setup.

**Short version (SQLite — no Docker):**
```bash
# 1. Backend
cd backend
# Create backend/.env with content from deploy_local.md
pip install -r requirements.txt
python -m app.seed
uvicorn app.main:app --reload --port 8000

# 2. Frontend (separate terminal)
cd frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) and log in.

## Seed Credentials

| Role  | Username | Password |
|-------|----------|----------|
| Admin | admin    | admin    |
| User  | user     | user     |

Change these immediately after first production deploy.

## API Docs

Interactive Swagger UI at [http://localhost:8000/docs](http://localhost:8000/docs)

## Key Endpoints

```
POST   /api/v1/auth/login
POST   /api/v1/auth/logout

GET    /api/v1/users/me
GET    /api/v1/users                   (any authenticated user)
POST   /api/v1/users                   (admin)
PATCH  /api/v1/users/{id}              (admin)
DELETE /api/v1/users/{id}              (admin)

GET    /api/v1/projects
POST   /api/v1/projects                (admin)
GET    /api/v1/projects/{id}
PATCH  /api/v1/projects/{id}           (admin)
DELETE /api/v1/projects/{id}           (admin)

GET    /api/v1/projects/{id}/folders
POST   /api/v1/projects/{id}/folders
DELETE /api/v1/projects/{id}/folders/{fid}  (admin or project lead)

GET    /api/v1/files/project/{id}
POST   /api/v1/files/project/{id}
GET    /api/v1/files/{id}/download
DELETE /api/v1/files/{id}              (admin, uploader, or project lead)

GET    /api/v1/dashboard
GET    /api/v1/audit

GET    /health
```

## Project Structure

```
benkas_worplace/
├── backend/
│   └── app/
│       ├── api/
│       │   ├── auth.py         # Login / logout (cookie sessions)
│       │   ├── users.py        # User management (admin CRUD + /me)
│       │   ├── projects.py     # Projects CRUD
│       │   ├── folders.py      # Per-project folder management
│       │   ├── files.py        # File upload / download / delete
│       │   ├── dashboard.py    # Aggregated KPI data
│       │   ├── audit.py        # Audit log feed
│       │   ├── deps.py         # Auth dependencies
│       │   └── router.py       # Registers all routers
│       ├── core/
│       │   ├── config.py       # Settings (reads .env)
│       │   └── security.py     # hash_password / verify_password
│       ├── db/
│       │   └── session.py      # SQLAlchemy engine + get_db
│       ├── models/
│       │   ├── user.py
│       │   ├── project.py      # Includes responsible_id (project lead)
│       │   ├── file.py         # Includes folder_id (nullable FK)
│       │   ├── folder.py       # ProjectFolder model
│       │   └── audit_log.py    # AuditLog model
│       ├── schemas/            # Pydantic request / response models
│       ├── services/
│       │   ├── storage.py      # Local filesystem file storage
│       │   └── audit.py        # log_action() helper
│       └── seed.py             # Demo users + 8 sample projects
├── frontend/
│   └── src/
│       ├── api/                # Axios wrappers (auth, projects, files, folders, users, audit)
│       ├── components/         # StatCard, ChartCard, ProjectTable, FileManager, ProjectFormModal
│       ├── i18n/               # en.ts, ru.ts translation files
│       ├── layouts/            # MainLayout (sidebar + language switcher)
│       ├── pages/
│       │   ├── DashboardPage.tsx
│       │   ├── ProjectsPage.tsx
│       │   ├── ProjectDetailPage.tsx  # Folder + file manager
│       │   ├── ActivityPage.tsx
│       │   ├── AdminPage.tsx
│       │   └── LoginPage.tsx
│       ├── styles/             # global.css
│       ├── contexts.ts         # UserContext
│       └── types/              # TypeScript interfaces
├── docker-compose.yml
├── CLAUDE.md                   # Agent session log
├── deploy_local.md
└── deploy_server.md
```
