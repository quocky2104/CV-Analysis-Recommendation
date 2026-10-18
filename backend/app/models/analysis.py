import json
import uuid
from datetime import datetime, timezone
from typing import Any, Optional

from app.database import Base
from app.schemas.analysis import AnalysisResponse, AnalysisSummary

try:
    from sqlalchemy import Boolean, DateTime, Integer, String, Text
    from sqlalchemy.orm import Mapped, mapped_column
    SQLALCHEMY_AVAILABLE = True
except ImportError:
    SQLALCHEMY_AVAILABLE = False
    class _Mapped:
        def __class_getitem__(cls, item):
            return item
    Mapped = _Mapped  # type: ignore
    class _DummyType:
        def __call__(self, *args, **kwargs):
            return self
        def __init__(self, *args, **kwargs):
            pass

    Boolean = DateTime = Integer = String = Text = _DummyType()
    def mapped_column(*args, **kwargs):  # type: ignore
        return None


class SavedAnalysis(Base):
    __tablename__ = "saved_analyses"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
    job_title: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    candidate_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    overall_score: Mapped[int] = mapped_column(Integer, nullable=False)
    total_requirements: Mapped[int] = mapped_column(Integer, nullable=False)
    matched_count: Mapped[int] = mapped_column(Integer, nullable=False)
    partial_count: Mapped[int] = mapped_column(Integer, nullable=False)
    not_evidenced_count: Mapped[int] = mapped_column(Integer, nullable=False)
    provider: Mapped[str] = mapped_column(String(50), nullable=False)
    is_demo_mode: Mapped[bool] = mapped_column(Boolean, default=False)
    full_data_json: Mapped[str] = mapped_column(Text, nullable=False)

    @classmethod
    def from_response(cls, response: AnalysisResponse) -> "SavedAnalysis":
        candidate_name = response.cv_profile.name if response.cv_profile else None
        return cls(
            id=response.analysis_id,
            created_at=response.timestamp,
            job_title=response.job_title,
            candidate_name=candidate_name,
            overall_score=response.scores.overall_score,
            total_requirements=response.scores.total_requirements,
            matched_count=response.scores.matched,
            partial_count=response.scores.partial,
            not_evidenced_count=response.scores.not_evidenced,
            provider=response.provider,
            is_demo_mode=response.is_demo_mode,
            full_data_json=response.model_dump_json(),
        )

    def to_response(self) -> AnalysisResponse:
        data = json.loads(self.full_data_json)
        return AnalysisResponse.model_validate(data)

    def to_summary(self) -> AnalysisSummary:
        return AnalysisSummary(
            id=self.id,
            timestamp=self.created_at,
            job_title=self.job_title,
            candidate_name=self.candidate_name,
            overall_score=self.overall_score,
            total_requirements=self.total_requirements,
            matched=self.matched_count,
            partial=self.partial_count,
            not_evidenced=self.not_evidenced_count,
            provider=self.provider,
            is_demo_mode=self.is_demo_mode,
        )
