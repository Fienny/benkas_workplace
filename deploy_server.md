# Server / Production Deployment

## Overview

Recommended production topology:

```
Internet → Nginx (80/443) → Frontend static files
                          → /api/v1/* reverse proxy → Uvicorn (8000)
                                                    → PostgreSQL (5432, internal)
```

---

## 1. Environment variables

Create `/home/<user>/benkas_worplace/backend/.env` (do NOT commit this file):

```env
APP_NAME=Benka Workbench
APP_ENV=production
SECRET_KEY=<long-random-string>          # openssl rand -hex 32
ACCESS_TOKEN_EXPIRE_MINUTES=1440
DATABASE_URL=postgresql+psycopg://postgres:<password>@db:5432/benka_workbench
STORAGE_PATH=/app/storage
CORS_ORIGINS=https://yourdomain.com
```

---

## 2. Docker Compose (full stack)

Extend `docker-compose.yml` for production — add the frontend build:

```yaml
services:
  db:
    image: postgres:16
    restart: always
    environment:
      POSTGRES_DB: benka_workbench
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: <password>
    volumes:
      - pg_data:/var/lib/postgresql/data

  backend:
    build: ./backend
    restart: always
    env_file: ./backend/.env
    depends_on:
      - db
    volumes:
      - ./backend/storage:/app/storage

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.prod       # see below
    restart: always
    ports:
      - "80:80"
    depends_on:
      - backend

volumes:
  pg_data:
```

### Frontend production Dockerfile (`frontend/Dockerfile.prod`)

```dockerfile
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

### Nginx config (`frontend/nginx.conf`)

```nginx
server {
    listen 80;

    root /usr/share/nginx/html;
    index index.html;

    # SPA fallback
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy API calls to backend
    location /api/ {
        proxy_pass http://backend:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Proxy health check
    location /health {
        proxy_pass http://backend:8000;
    }
}
```

> When using Nginx proxy, update the frontend API base URL (`frontend/src/api/client.ts`)
> to use a relative path `/api/v1` instead of `http://localhost:8000/api/v1`.

---

## 3. Seed production database

Run once after first deploy:

```bash
docker compose exec backend python -m app.seed
```

Then **change the default passwords immediately** via the API or directly in the database.

---

## 4. HTTPS with Let's Encrypt

Use [Certbot](https://certbot.eff.org/) with the Nginx plugin:

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

---

## 5. File storage

Currently files are stored on the local filesystem (`STORAGE_PATH`).  
For multi-instance or cloud deployments, migrate to object storage:

- **MinIO** (self-hosted S3-compatible): add a `minio` service to Docker Compose
- **AWS S3**: replace `StorageService` in `backend/app/services/storage.py` with `boto3`

---

## 6. Checklist before going live

- [ ] `SECRET_KEY` is a random 32+ byte string (never the default)
- [ ] `APP_ENV=production` in `.env`
- [ ] Database password is strong and not the default `postgres`
- [ ] HTTPS is configured
- [ ] `CORS_ORIGINS` only lists your actual frontend domain
- [ ] Default seed passwords changed or accounts removed
- [ ] `storage/` directory is on a persistent volume
- [ ] Backups scheduled for PostgreSQL (`pg_dump` cron or managed DB service)
