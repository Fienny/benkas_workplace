from functools import lru_cache
from typing import List

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file='.env', env_file_encoding='utf-8', extra='ignore')

    app_name: str = 'Benka Workbench API'
    app_env: str = 'development'
    secret_key: str = Field(..., alias='SECRET_KEY')
    access_token_expire_minutes: int = 60 * 24
    database_url: str = Field(..., alias='DATABASE_URL')
    storage_path: str = 'storage'
    cors_origins: List[str] | str = Field(default_factory=lambda: ['http://localhost:3000'])

    @field_validator('cors_origins', mode='before')
    @classmethod
    def parse_cors_origins(cls, value: str | List[str]):
        if isinstance(value, list):
            return value
        return [item.strip() for item in value.split(',') if item.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
