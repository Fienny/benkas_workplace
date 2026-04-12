# CLAUDE.md — Agent Working Log

This file tracks what has been done in each Claude session.
**Always read this before starting any work.**

---

## Session 1 — Initial MVP completion (2026-04-12)

### What was already there (by the developer)
- FastAPI backend with JWT auth skeleton, PostgreSQL, SQLAlchemy models
- React + Vite + TypeScript frontend with Recharts dashboard
- Docker Compose setup (db + backend services)
- Models: User, Project, ProjectFile
- API: auth, projects, files, dashboard, users
- Seed data script with 8 projects and 2 users
- Basic ProjectTable, StatCard, ChartCard components
- CSS grid layout with sidebar

### What was broken
1. `deps.py` — `get_current_user()` always returned first DB user (JWT never validated)
2. `seed.py` — admin email was `admin@gmail.com` but frontend logged in as `admin@benka.local`
3. `files.py` — permission check compared string `'admin'` to enum `UserRole.admin`
4. Sidebar user was hardcoded (`Admin Benka` / `Admin`)
5. No file upload UI (backend existed, frontend was missing)
6. ProjectTable had plain text progress (no bars)

### What was fixed / added

**Backend**
- `backend/app/api/deps.py` — full JWT validation: decode token → lookup user by ID → check is_active
- `backend/app/seed.py` — admin email changed to `admin@benka.local`
- `backend/app/api/files.py` — permission check now uses `UserRole.admin` enum

**Frontend**
- `frontend/src/types/index.ts` — added `ProjectFile` and `User` types
- `frontend/src/api/users.ts` — `fetchMe()` call
- `frontend/src/api/files.ts` — `fetchProjectFiles`, `uploadFile`, `deleteFile`, `downloadUrl`
- `frontend/src/App.tsx` — fetches current user after login, exposes via `UserContext`
- `frontend/src/layouts/MainLayout.tsx` — reads `UserContext`, shows real name/initials/role, active nav link styling fixed
- `frontend/src/components/ProjectTable.tsx` — color-coded progress bars, region badges, file count badges
- `frontend/src/components/FileManager.tsx` — modal overlay for file list, upload, delete, download per project
- `frontend/src/pages/ProjectsPage.tsx` — file icon button per row opens FileManager modal
- `frontend/src/styles/global.css` — progress bars, file manager styles, table polish, responsive breakpoints

**Docs**
- `README.md` — full project overview, stack, quickstart
- `CLAUDE.md` — this file
- `deploy_local.md` — local dev setup guide
- `deploy_server.md` — production deployment guide

### Credentials (seed data)
| Role  | Email              | Password   |
|-------|--------------------|------------|
| Admin | admin@benka.local  | Admin123!  |
| User  | user@benka.local   | User123!   |

---

## How to continue work

1. Read this file first.
2. Start the stack: `docker compose up -d db && cd backend && uvicorn app.main:app --reload`
3. Frontend: `cd frontend && npm run dev`
4. Make changes on branch `claude/finish-dashboard-wJqb0`
5. Commit with clear messages and push.
6. Update this file with what changed.
