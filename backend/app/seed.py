from sqlalchemy import select

from app.core.security import hash_password
from app.db.base import Base
from app.db.session import SessionLocal, engine
from app.models.project import Project
from app.models.user import User, UserRole


def _upsert_user(db, email: str, full_name: str, password: str, role: UserRole) -> User:
    user = db.scalar(select(User).where(User.email == email))
    if not user:
        user = User(
            full_name=full_name,
            email=email,
            password_hash=hash_password(password),
            role=role,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        print(f'  Created user: {email}')
    else:
        print(f'  Exists:       {email}')
    return user


def run() -> None:
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        # Migrate old admin email if it exists
        old_admin = db.scalar(select(User).where(User.email == 'admin@gmail.com'))
        if old_admin:
            old_admin.email = 'admin@benka.local'
            db.commit()
            print('  Migrated admin@gmail.com → admin@benka.local')

        admin = _upsert_user(db, 'admin@benka.local', 'Admin Benka',    'Admin123!', UserRole.admin)
        user  = _upsert_user(db, 'user@benka.local',  'Engineer User',  'User123!',  UserRole.user)

        seed_projects = [
            dict(code='EA-AND-6001',  title='Andijan Audit',              type='Project',                           region='AND', status='active',    progress=82),
            dict(code='PJ-TAS-1001',  title='Tashkent STC',               type='Special Technical Conditions',      region='TAS', status='active',    progress=72),
            dict(code='AO-FER-5010',  title='Fergana Expertise',           type='Экспертная аналитика',              region='FER', status='active',    progress=61),
            dict(code='STC-SUR-2050', title='Surkhandarya Survey',         type='Техническое обследование',          region='SUR', status='active',    progress=45),
            dict(code='TEO-BUX-4400', title='Bukhara TEO',                 type='Технико-экономическое обоснование', region='BUX', status='active',    progress=31),
            dict(code='STC-KAR-6100', title='Karakalpakstan Author Review', type='Авторский обзор',                  region='KAR', status='active',    progress=15),
            dict(code='PJ-SAM-3030',  title='Samarkand Review',            type='Project',                           region='SAM', status='draft',     progress=0),
            dict(code='PJ-QAS-8040',  title='Qashqadaryo Completion',      type='Special Technical Conditions',      region='QAS', status='completed', progress=100),
        ]

        for i, p in enumerate(seed_projects):
            existing = db.scalar(select(Project).where(Project.code == p['code']))
            if not existing:
                owner = admin if i % 2 == 0 else user
                db.add(Project(**p, owner_id=owner.id))
                print(f'  Created project: {p["code"]}')
            else:
                print(f'  Exists:          {p["code"]}')
        db.commit()

        print('\nSeed complete.')
        print('  admin@benka.local / Admin123!')
        print('  user@benka.local  / User123!')
    finally:
        db.close()


if __name__ == '__main__':
    run()
