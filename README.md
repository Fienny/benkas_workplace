# Benka Workbench MVP

Быстрый MVP под заказчика: FastAPI + PostgreSQL + React/Vite dashboard.

## Что уже есть
- JWT-авторизация
- Роли `admin` / `user`
- CRUD проектов
- Загрузка, скачивание и удаление файлов по проектам
- Dashboard API со сводной статистикой
- React frontend в стиле прикрепленного дашборда
- Seed с тестовыми пользователями и проектами

## Структура
- `backend/` — FastAPI + SQLAlchemy
- `frontend/` — React + Vite + Recharts
- `docker-compose.yml` — Postgres + backend

## Быстрый запуск

### 1. Backend
```bash
cd backend
cp .env.example .env
pip install -r requirements.txt
python -m app.seed
uvicorn app.main:app --reload --port 8000
OR
python -m uvicorn app.main:app --reload --port 8000
```

### 2. Frontend
```bash
cd frontend
npm install
npm run dev
```

### 3. Demo access
Frontend автоматически логинится под seed-admin:
- email: `admin@benka.local`
- password: `Admin123!`

## Ключевые endpoints
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `GET /api/v1/users/me`
- `GET /api/v1/projects`
- `POST /api/v1/projects`
- `PATCH /api/v1/projects/{id}`
- `DELETE /api/v1/projects/{id}`
- `GET /api/v1/files/project/{project_id}`
- `POST /api/v1/files/project/{project_id}`
- `GET /api/v1/files/{file_id}/download`
- `DELETE /api/v1/files/{file_id}`
- `GET /api/v1/dashboard`

## Что я бы доделал следующим шагом
1. Alembic миграции вместо `create_all`
2. S3/MinIO вместо локального storage
3. Отдельная таблица project_members
4. Audit log по действиям пользователей
5. Настоящая login page и admin UI
6. Nginx + docker compose для полного деплоя
