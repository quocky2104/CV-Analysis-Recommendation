from typing import Generator
from fastapi import Depends
try:
    from sqlalchemy.orm import Session
except ImportError:
    Session = object  # type: ignore

from app.config import Settings, get_settings
from app.database import get_db
from app.services.analysis_service import AnalysisService
from app.services.llm_service import AIProvider, create_ai_provider


def get_ai_provider_dep(settings: Settings = Depends(get_settings)) -> AIProvider:
    return create_ai_provider(
        provider_type=settings.ai_provider,
        openai_api_key=settings.openai_api_key,
        openai_model=settings.openai_model,
    )


def get_analysis_service(
    ai_provider: AIProvider = Depends(get_ai_provider_dep),
    settings: Settings = Depends(get_settings),
) -> AnalysisService:
    return AnalysisService(ai_provider=ai_provider, settings=settings)
