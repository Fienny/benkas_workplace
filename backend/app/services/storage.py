from pathlib import Path
from uuid import uuid4

from fastapi import UploadFile

from app.core.config import get_settings


class StorageService:
    def __init__(self) -> None:
        settings = get_settings()
        self.base_path = Path(settings.storage_path)
        self.base_path.mkdir(parents=True, exist_ok=True)

    def save(self, upload: UploadFile) -> tuple[str, str, int]:
        extension = Path(upload.filename or '').suffix
        stored_name = f'{uuid4().hex}{extension}'
        absolute_path = self.base_path / stored_name

        content = upload.file.read()
        absolute_path.write_bytes(content)

        return stored_name, str(absolute_path), len(content)

    def delete(self, file_path: str) -> None:
        path = Path(file_path)
        if path.exists():
            path.unlink()
