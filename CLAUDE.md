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

---

## Session 2 & 3 — Cookie sessions, username login (2026-04-13)

### What changed

**Backend**
- `backend/requirements.txt` — removed `python-jose`, `email-validator`; added `itsdangerous>=2.1.0`
- `backend/app/core/security.py` — stripped to `hash_password` / `verify_password` only (no JWT)
- `backend/app/models/user.py` — renamed `email` → `username` column
- `backend/app/schemas/auth.py` — `LoginRequest(username, password)` with no email validation
- `backend/app/schemas/user.py` — `UserResponse.username: str`
- `backend/app/api/auth.py` — login sets `request.session['user_id']`; logout clears session
- `backend/app/api/deps.py` — reads `request.session['user_id']` instead of Bearer token
- `backend/app/main.py` — added `SessionMiddleware(secret_key, same_site='lax', https_only=False, max_age=30days)`
- `backend/app/seed.py` — credentials simplified to `admin`/`admin` + `user`/`user`

**Frontend**
- `frontend/vite.config.ts` — added Vite proxy `/api` → `http://127.0.0.1:8000`
- `frontend/src/api/client.ts` — relative `baseURL: '/api/v1'`, `withCredentials: true`
- `frontend/src/types/index.ts` — `User.username` instead of `User.email`
- `frontend/src/contexts.ts` — extracted `UserContext` here to break circular import
- `frontend/src/App.tsx` — calls `fetchMe()` on load to detect session; no localStorage
- `frontend/src/pages/LoginPage.tsx` — username field; submits `{username, password}`
- `frontend/src/layouts/MainLayout.tsx` — logout calls `POST /auth/logout` before clearing state

---

## Session 4 — Full feature completion (2026-04-13/14)

### Features added

**Admin Panel**
- `backend/app/api/users.py` — `POST /users`, `PATCH /users/{id}`, `DELETE /users/{id}` (admin only)
- `frontend/src/pages/AdminPage.tsx` — user table with role toggle, activate/deactivate, delete; "you" badge on own row
- Admin-only delete button on Projects page

**i18n — English / Russian**
- `frontend/src/i18n/en.ts`, `ru.ts` — full translations for all pages
- `frontend/src/layouts/MainLayout.tsx` — EN/RU switcher, language saved in localStorage
- All pages and components use `useTranslation()` hooks

**Activity / Audit Log**
- `backend/app/models/audit_log.py` — `AuditLog` model (user_id, user_name, action, entity_label, context_label, created_at)
- `backend/app/services/audit.py` — `log_action(db, user, action, entity_label, context_label=None)` helper
- `backend/app/api/audit.py` — `GET /api/v1/audit` returns last 150 entries
- All create/update/delete operations in projects, users, files log to audit table
- `frontend/src/pages/ActivityPage.tsx` — date-grouped feed with colored action icons
- `frontend/src/api/audit.ts` — `fetchAuditLog()`

**Project Lead**
- `backend/app/models/project.py` — `responsible_id` FK to users; two separate relationships for owner vs. responsible
- `backend/app/schemas/project.py` — `responsible_id`, `responsible_name` in ProjectResponse
- `backend/app/api/files.py` — delete permission: admin OR uploader OR project lead
- `frontend/src/components/ProjectFormModal.tsx` — admin sees lead dropdown; engineers see read-only field

**Per-project folder file manager**
- `backend/app/models/folder.py` — `ProjectFolder` model (project_id, name, created_by, UniqueConstraint)
- `backend/app/models/file.py` — added `folder_id` nullable FK with `ON DELETE SET NULL`
- `backend/app/api/folders.py` — `GET/POST /projects/{id}/folders`, `DELETE /projects/{id}/folders/{fid}` (admin/lead only, must be empty)
- `backend/app/api/files.py` — upload accepts optional `folder_id: int | None = Form(None)`
- `frontend/src/pages/ProjectDetailPage.tsx` — full folder+file manager: breadcrumb, folder creation, file upload per folder, delete with 403 handling
- `frontend/src/pages/ProjectsPage.tsx` — clicking a project row navigates to detail page (edit/delete buttons stop propagation)
- `frontend/src/api/folders.ts` — `fetchFolders`, `createFolder`, `deleteFolder`

**SQLite local dev support**
- `backend/app/db/session.py` — `connect_args={"check_same_thread": False}` when URL starts with `sqlite`
- `backend/.env` — SQLite config (gitignored; must be created manually — see `deploy_local.md`)

### Bug fixed (Session 4 end)
- `backend/app/api/users.py` line 22 — `AttributeError: 'Select' object has no attribute 'all'`
  - `.all()` was inside `db.scalars(...)` parentheses; moved outside

---

## Current state

| Area             | Status                                      |
|------------------|---------------------------------------------|
| Auth             | Cookie sessions, username/password login    |
| Projects         | Full CRUD, lead assignment, delete (admin)  |
| Files            | Upload/download/delete with folder support  |
| Folders          | One level deep per project                  |
| Dashboard        | 6 KPI cards + 4 charts                      |
| Activity log     | All actions logged, date-grouped feed       |
| Admin panel      | Create/toggle/delete users                  |
| i18n             | English + Russian, switcher in sidebar      |
| Local dev        | SQLite, no Docker needed                    |
| Production ready | PostgreSQL + Docker Compose + Nginx config  |

## Credentials

| Role  | Username | Password |
|-------|----------|----------|
| Admin | admin    | admin    |
| User  | user     | user     |

---

## How to continue work

1. Read this file first.
2. Create `backend/.env` if missing (see `deploy_local.md`).
3. Start backend: `cd backend && uvicorn app.main:app --reload --port 8000`
4. Start frontend: `cd frontend && npm run dev`
5. Work on branch `claude/finish-dashboard-wJqb0`.
6. Commit with clear messages and push.
7. Update this file with what changed.

## Known limitations / future work

- No Alembic migrations — schema changes require a DB reset (`rm benka.db && python -m app.seed`)
- File storage is local filesystem — not suitable for multi-instance deployments without a shared volume or S3
- Folders are one level deep only
- No email notifications
- No password change UI (admin must update directly in DB or delete/recreate user)
