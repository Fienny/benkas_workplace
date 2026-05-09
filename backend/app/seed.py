from sqlalchemy import select

from app.core.security import hash_password
from app.db.base import Base
from app.db.session import SessionLocal, engine
from app.models.project import Project
from app.models.user import User, UserRole

ACCOUNTS = [
    dict(username='admin', full_name='Admin Benka',   password='admin', role=UserRole.admin),
    dict(username='user',  full_name='Engineer User', password='user',  role=UserRole.user),
]


def _ensure_user(db, username: str, full_name: str, password: str, role: UserRole) -> User:
    u = db.scalar(select(User).where(User.username == username))
    if u:
        u.password_hash = hash_password(password)
        u.full_name = full_name
        u.role = role
        db.commit()
        print(f'  Updated : {username}')
    else:
        u = User(username=username, full_name=full_name,
                 password_hash=hash_password(password), role=role)
        db.add(u)
        db.commit()
        db.refresh(u)
        print(f'  Created : {username}')
    return u


def run() -> None:
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        users = [_ensure_user(db, **a) for a in ACCOUNTS]
        admin, regular = users[0], users[1]

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
                db.add(Project(**p, owner_id=(admin if i % 2 == 0 else regular).id))
                print(f'  Created project: {p["code"]}')
            else:
                print(f'  Exists  project: {p["code"]}')
        db.commit()

        print()
        print('Seed complete.')
        for a in ACCOUNTS:
            print(f'  {a["role"].value:5s}  login: {a["username"]}  /  password: {a["password"]}')
    finally:
        db.close()


if __name__ == '__main__':
    run()
