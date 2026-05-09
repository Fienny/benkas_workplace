from pathlib import Path
from uuid import uuid4

import boto3
from fastapi import UploadFile

from app.core.config import get_settings


class StorageService:
    def __init__(self) -> None:
        settings = get_settings()
        self._use_s3 = bool(settings.wasabi_bucket)

        if self._use_s3:
            self._bucket = settings.wasabi_bucket
            self._client = boto3.client(
                's3',
                endpoint_url=settings.wasabi_endpoint,
                aws_access_key_id=settings.wasabi_access_key,
                aws_secret_access_key=settings.wasabi_secret_key,
                region_name=settings.wasabi_region,
            )
        else:
            self.base_path = Path(settings.storage_path)
            self.base_path.mkdir(parents=True, exist_ok=True)

    def save(self, upload: UploadFile) -> tuple[str, str, int]:
        extension = Path(upload.filename or '').suffix
        stored_name = f'{uuid4().hex}{extension}'
        content = upload.file.read()

        if self._use_s3:
            self._client.put_object(
                Bucket=self._bucket,
                Key=stored_name,
                Body=content,
                ContentType=upload.content_type or 'application/octet-stream',
            )
            return stored_name, stored_name, len(content)
        else:
            path = self.base_path / stored_name
            path.write_bytes(content)
            return stored_name, str(path), len(content)

    def delete(self, file_path: str) -> None:
        if self._use_s3:
            self._client.delete_object(Bucket=self._bucket, Key=file_path)
        else:
            path = Path(file_path)
            if path.exists():
                path.unlink()

    def presigned_url(self, file_path: str, filename: str) -> str | None:
        """Returns a 1-hour presigned download URL. None when using local storage."""
        if not self._use_s3:
            return None
        return self._client.generate_presigned_url(
            'get_object',
            Params={
                'Bucket': self._bucket,
                'Key': file_path,
                'ResponseContentDisposition': f'attachment; filename="{filename}"',
            },
            ExpiresIn=3600,
        )
