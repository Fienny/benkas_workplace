from sqlalchemy import select

from app.core.security import hash_password
from app.db.base import Base
from app.db.session import SessionLocal, engine
from app.models.project import Project
from app.models.user import User, UserRole

# ── Credentials ──────────────────────────────────────────────────────────────
ADMIN_EMAIL    = 'admin'
ADMIN_PASSWORD = 'admin'
USER_EMAIL     = 'user'
USER_PASSWORD  = 'user'

# Legacy emails that may exist in older databases — will be migrated
LEGACY_ADMIN_EMAILS = ['admin@gmail.com', 'admin@benka.local', 'admin@benka.com']
LEGACY_USER_EMAILS  = ['user@benka.local', 'user@benka.com']


def _ensure_user(db, email: str, full_name: str, password: str, role: UserRole) -> User:
    user = db.scalar(select(User).where(User.email == email))
    if user:
        # Always refresh the password so re-seeding restores known credentials
        user.password_hash = hash_password(password)
        db.commit()
        print(f'  Updated:  {email}')
    else:
        user = User(
            full_name=full_name,
            email=email,
            password_hash=hash_password(password),
            role=role,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        print(f'  Created:  {email}')
    return user


def run() -> None:
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        # ── Migrate legacy admin accounts ──────────────────────────────────
        for old_email in LEGACY_ADMIN_EMAILS:
            old = db.scalar(select(User).where(User.email == old_email))
            if old:
                old.email = ADMIN_EMAIL
                old.password_hash = hash_password(ADMIN_PASSWORD)
                db.commit()
                print(f'  Migrated: {old_email} → {ADMIN_EMAIL}')

        for old_email in LEGACY_USER_EMAILS:
            old = db.scalar(select(User).where(User.email == old_email))
            if old:
                old.email = USER_EMAIL
                old.password_hash = hash_password(USER_PASSWORD)
                db.commit()
                print(f'  Migrated: {old_email} → {USER_EMAIL}')

        # ── Ensure canonical accounts exist ───────────────────────────────
        admin = _ensure_user(db, ADMIN_EMAIL, 'Admin Benka',   ADMIN_PASSWORD, UserRole.admin)
        user  = _ensure_user(db, USER_EMAIL,  'Engineer User', USER_PASSWORD,  UserRole.user)

        # ── Seed sample projects (skips if code already exists) ───────────
        seed_projects = [
            dict(code='EA-AND-6001',  title='Andijan Audit',               type='Project',                           region='AND', status='active',    progress=82),
            dict(code='PJ-TAS-1001',  title='Tashkent STC',                type='Special Technical Conditions',      region='TAS', status='active',    progress=72),
            dict(code='AO-FER-5010',  title='Fergana Expertise',            type='Экспертная аналитика',              region='FER', status='active',    progress=61),
            dict(code='STC-SUR-2050', title='Surkhandarya Survey',          type='Техническое обследование',          region='SUR', status='active',    progress=45),
            dict(code='TEO-BUX-4400', title='Bukhara TEO',                  type='Технико-экономическое обоснование', region='BUX', status='active',    progress=31),
            dict(code='STC-KAR-6100', title='Karakalpakstan Author Review',  type='Авторский обзор',                  region='KAR', status='active',    progress=15),
            dict(code='PJ-SAM-3030',  title='Samarkand Review',             type='Project',                           region='SAM', status='draft',     progress=0),
            dict(code='PJ-QAS-8040',  title='Qashqadaryo Completion',       type='Special Technical Conditions',      region='QAS', status='completed', progress=100),
        ]

        for i, p in enumerate(seed_projects):
            if not db.scalar(select(Project).where(Project.code == p['code'])):
                owner = admin if i % 2 == 0 else user
                db.add(Project(**p, owner_id=owner.id))
                print(f'  Created project: {p["code"]}')
            else:
                print(f'  Exists  project: {p["code"]}')
        db.commit()

        print()
        print('Seed complete.')
        print(f'  Admin : {ADMIN_EMAIL!r}  /  {ADMIN_PASSWORD!r}')
        print(f'  User  : {USER_EMAIL!r}   /  {USER_PASSWORD!r}')

    finally:
        db.close()


if __name__ == '__main__':
    run()
