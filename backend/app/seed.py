from sqlalchemy import select

from app.core.security import hash_password
from app.db.base import Base
from app.db.session import SessionLocal, engine
from app.models.project import Project
from app.models.user import User, UserRole


def run() -> None:
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        if not db.scalar(select(User).where(User.email == 'admin@gmail.com')):
            admin = User(
                full_name='Admin Benka',
                email='admin@gmail.com',
                password_hash=hash_password('Admin123!'),
                role=UserRole.admin,
            )
            user = User(
                full_name='Engineer User',
                email='user@benka.local',
                password_hash=hash_password('User123!'),
                role=UserRole.user,
            )
            db.add_all([admin, user])
            db.commit()
            db.refresh(admin)
            db.refresh(user)

            projects = [
                Project(code='EA-AND-6001', title='Andijan Audit', type='Project', region='AND', status='active', progress=82, owner_id=admin.id),
                Project(code='PJ-TAS-1001', title='Tashkent STC', type='Special Technical Conditions', region='TAS', status='active', progress=72, owner_id=admin.id),
                Project(code='AO-FER-5010', title='Fergana Expertise', type='Экспертная аналитика', region='FER', status='active', progress=61, owner_id=user.id),
                Project(code='STC-SUR-2050', title='Surkhandarya Survey', type='Техническое обследование', region='SUR', status='active', progress=45, owner_id=user.id),
                Project(code='TEO-BUX-4400', title='Bukhara TEO', type='Технико-экономическое обоснование', region='BUX', status='active', progress=31, owner_id=admin.id),
                Project(code='STC-KAR-6100', title='Karakalpakstan Author Review', type='Авторский обзор', region='KAR', status='active', progress=15, owner_id=user.id),
                Project(code='PJ-SAM-3030', title='Samarkand Review', type='Project', region='SAM', status='draft', progress=0, owner_id=admin.id),
                Project(code='PJ-QAS-8040', title='Qashqadaryo Completion', type='Special Technical Conditions', region='QAS', status='completed', progress=100, owner_id=admin.id),
            ]
            db.add_all(projects)
            db.commit()
    finally:
        db.close()


if __name__ == '__main__':
    run()
