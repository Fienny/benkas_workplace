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

## Session 2 & 3 — Cookie sessions, username login (2026-04-13)

### What changed

**Backend**
- `backend/requirements.txt` — removed `python-jose`, `email-validator`; added `itsdangerous>=2.1.0`
- `backend/app/core/security.py` — stripped to `hash_password` / `verify_password` only (no JWT)
- `backend/app/models/user.py` — renamed `email` → `username` column (DB reset required!)
- `backend/app/schemas/auth.py` — `LoginRequest(username, password)` with no email validation
- `backend/app/schemas/user.py` — `UserResponse.username: str` (no EmailStr)
- `backend/app/api/auth.py` — login sets `request.session['user_id']`; logout clears session; no token returned
- `backend/app/api/deps.py` — reads `request.session['user_id']` instead of Bearer token
- `backend/app/main.py` — added `SessionMiddleware(secret_key, same_site='lax', https_only=False, max_age=30days)`
- `backend/app/seed.py` — simple `admin`/`admin` + `user`/`user` credentials

**Frontend**
- `frontend/vite.config.ts` — added Vite proxy `/api` → `http://127.0.0.1:8000` (fixes Windows IPv6/IPv4 issue)
- `frontend/src/api/client.ts` — relative `baseURL: '/api/v1'`, `withCredentials: true`, no auth interceptor
- `frontend/src/types/index.ts` — `User.username` instead of `User.email`
- `frontend/src/contexts.ts` — extracted `UserContext` here to break circular import
- `frontend/src/App.tsx` — calls `fetchMe()` on load to detect session; no localStorage; passes `User` to `onLogin`
- `frontend/src/pages/LoginPage.tsx` — username field (not email); submits `{username, password}`; no token stored
- `frontend/src/layouts/MainLayout.tsx` — logout calls `POST /auth/logout` before clearing state

### Credentials (updated)
| Role  | Username | Password |
|-------|----------|----------|
| Admin | admin    | admin    |
| User  | user     | user     |

### Reset required after pulling this session's changes
Because the `email` column was renamed to `username`, existing DBs must be wiped:
```powershell
docker compose down -v          # drop volumes (wipes DB)
pip install -r requirements.txt # get itsdangerous
docker compose up -d db
python -m app.seed              # re-seed
```

---

## How to continue work

1. Read this file first.
2. Start the stack: `docker compose up -d db && cd backend && uvicorn app.main:app --reload`
3. Frontend: `cd frontend && npm run dev`
4. Make changes on branch `claude/finish-dashboard-wJqb0`
5. Commit with clear messages and push.
6. Update this file with what changed.
