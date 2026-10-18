from typing import List
from pydantic import BaseModel, Field

from app.schemas.analysis import AnalysisResponse, RevisionSuggestion
from app.schemas.cv import CVProfile


class ReportExportRequest(BaseModel):
    analysis_data: AnalysisResponse


class CVExportRequest(BaseModel):
    cv_profile: CVProfile
    approved_suggestion_ids: List[str] = Field(default_factory=list)
    suggestions: List[RevisionSuggestion] = Field(default_factory=list)
