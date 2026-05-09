from sqlalchemy.orm import Session

from app.models.audit_log import AuditLog
from app.models.user import User


def log_action(
    db: Session,
    user: User,
    action: str,
    entity_label: str,
    context_label: str | None = None,
) -> None:
    """Add an audit log entry to the session (caller must commit)."""
    db.add(AuditLog(
        user_id=user.id,
        user_name=user.full_name,
        action=action,
        entity_label=entity_label,
        context_label=context_label,
    ))
