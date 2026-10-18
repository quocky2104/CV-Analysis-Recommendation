import os
from functools import lru_cache
from typing import List
try:
    from pydantic_settings import BaseSettings
except ImportError:
    from pydantic import BaseModel

    class BaseSettings(BaseModel):  # type: ignore
        def __init__(self, **values):
            super().__init__(**values)
            for field_name, field_info in self.__class__.model_fields.items():
                env_val = os.getenv(field_name.upper()) or os.getenv(field_name)
                if env_val is not None:
                    if field_info.annotation is int:
                        try:
                            setattr(self, field_name, int(env_val))
                        except ValueError:
                            pass
                    else:
                        setattr(self, field_name, env_val)


class Settings(BaseSettings):
    ai_provider: str = "mock"  # "openai" or "mock"
    openai_api_key: str = ""
    openai_model: str = "gpt-4o-mini"
    database_url: str = "sqlite:///./cvision.db"
    max_file_size_mb: int = 10
    max_extracted_text_chars: int = 60000
    frontend_origins: str = "http://localhost:3000"
    app_env: str = "development"
    secret_key: str = "change-me"

    model_config = {"env_file": ".env", "extra": "ignore"}

    @property
    def max_file_size_bytes(self) -> int:
        return self.max_file_size_mb * 1024 * 1024

    @property
    def cors_origins(self) -> List[str]:
        if not self.frontend_origins:
            return ["*"]
        origins = [origin.strip() for origin in self.frontend_origins.split(",") if origin.strip()]
        return origins if origins else ["*"]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
