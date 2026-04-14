# Server / Production Deployment

## Overview

Recommended production topology:

```
Internet → Nginx (80/443) → Frontend static files (dist/)
                          → /api/* reverse proxy → Uvicorn (8000)
                                                 → PostgreSQL (5432, internal)
```

---

## 1. Environment variables

Create `backend/.env` on the server (do NOT commit this file):

```env
APP_ENV=production
SECRET_KEY=<long-random-string>          # openssl rand -hex 32
DATABASE_URL=postgresql+psycopg://postgres:<password>@db:5432/benka_workbench
STORAGE_PATH=/app/storage
CORS_ORIGINS=https://yourdomain.com
```

Session cookies are signed with `SECRET_KEY` — keep it secret and stable (changing it logs everyone out).

---

## 2. Docker Compose (full stack)

`docker-compose.yml`:

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
      dockerfile: Dockerfile.prod
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

    # Proxy API + health to backend
    location /api/ {
        proxy_pass http://backend:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        # Required for cookie sessions
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /health {
        proxy_pass http://backend:8000;
    }
}
```

The Vite proxy in `frontend/vite.config.ts` is only for local dev — in production, Nginx handles `/api` → backend.

---

## 3. Build and start

```bash
# First deploy
docker compose up -d --build

# Seed the database (run once after first deploy)
docker compose exec backend python -m app.seed
```

**Change default passwords immediately** after seeding — via Admin Panel in the app or directly in the DB.

---

## 4. HTTPS with Let's Encrypt

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

Certbot will rewrite Nginx config to redirect HTTP → HTTPS automatically.

After enabling HTTPS, update `backend/.env`:
```
CORS_ORIGINS=https://yourdomain.com
```

---

## 5. File storage

Files are stored on the local filesystem at `STORAGE_PATH`.
Make sure this path is on a persistent Docker volume (see `docker-compose.yml` above).

For multi-instance or cloud deployments, replace `backend/app/services/storage.py` with an S3/MinIO implementation.

---

## 6. Pre-launch checklist

- [ ] `SECRET_KEY` is a random 32+ byte string (never the default)
- [ ] `APP_ENV=production` in `.env`
- [ ] `DATABASE_URL` points to your production database with a strong password
- [ ] `CORS_ORIGINS` lists only your actual frontend domain (no localhost)
- [ ] HTTPS configured and HTTP redirects to HTTPS
- [ ] Default seed credentials changed or users deleted
- [ ] `storage/` directory is on a persistent Docker volume
- [ ] PostgreSQL backups scheduled (`pg_dump` cron, or use a managed database service)
- [ ] Server firewall: only ports 80/443 exposed to the internet; 8000 and 5432 internal only
