from fastapi import APIRouter

from app.api import audit, auth, dashboard, files, projects, users

api_router = APIRouter(prefix='/api/v1')
api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(projects.router)
api_router.include_router(files.router)
api_router.include_router(dashboard.router)
api_router.include_router(audit.router)
