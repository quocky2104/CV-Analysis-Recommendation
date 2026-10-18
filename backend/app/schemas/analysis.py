from datetime import datetime, timezone
from typing import List, Optional
from pydantic import BaseModel, Field

from app.schemas.common import MatchStatus, Priority
from app.schemas.cv import CVProfile
from app.schemas.jd import JDAnalysis


class AnalysisRequest(BaseModel):
    output_language: str = Field(default="vi", description="Target language: vi or en")
    save_to_history: bool = Field(default=False, description="Persist analysis to database")


class RequirementMatch(BaseModel):
    requirement_id: str
    requirement: str
    priority: Priority
    category: str
    status: MatchStatus
    reason: str
    evidence: Optional[str] = None
    evidence_section: Optional[str] = None
    is_verified_quote: bool = False


class ScoreBreakdown(BaseModel):
    overall_score: int = Field(ge=0, le=100, description="Overall match percentage (0-100)")
    total_requirements: int = Field(ge=0)
    matched: int = Field(ge=0)
    partial: int = Field(ge=0)
    not_evidenced: int = Field(ge=0)
    required_score: int = Field(ge=0, le=100)
    preferred_score: int = Field(ge=0, le=100)
    nice_to_have_score: int = Field(ge=0, le=100)
    critical_gaps: List[str] = Field(default_factory=list, description="Required requirements missing from CV")


class QualityItem(BaseModel):
    score: float = Field(ge=1.0, le=5.0, description="Score on 1-5 scale")
    reason: str
    examples: List[str] = Field(default_factory=list)


class CVQualityReview(BaseModel):
    clarity: QualityItem
    relevance: QualityItem
    impact_evidence: QualityItem
    structure: QualityItem
    overall_quality_score: float = Field(ge=1.0, le=5.0)


class RevisionSuggestion(BaseModel):
    id: str
    section: str
    original_text: Optional[str] = None
    proposed_text: str
    reason: str
    related_requirement_ids: List[str] = Field(default_factory=list)
    evidence_basis: Optional[str] = None
    needs_user_input: bool = False
    priority: str = Field(default="medium", description="high, medium, low")


class KeywordGap(BaseModel):
    keyword: str
    importance: str = Field(default="high", description="high, medium, low")
    reason: str


class TermEquivalent(BaseModel):
    jd_term: str
    cv_term: str
    notes: Optional[str] = None


class KeywordAnalysis(BaseModel):
    found_in_cv: List[str] = Field(default_factory=list)
    missing_from_cv: List[KeywordGap] = Field(default_factory=list)
    terminology_equivalents: List[TermEquivalent] = Field(default_factory=list)


class AnalysisResponse(BaseModel):
    analysis_id: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    job_title: Optional[str] = None
    provider: str = Field(description="AI provider used: openai or mock")
    is_demo_mode: bool = False
    scores: ScoreBreakdown
    requirement_matches: List[RequirementMatch] = Field(default_factory=list)
    strengths: List[str] = Field(default_factory=list)
    gaps: List[str] = Field(default_factory=list)
    keyword_analysis: KeywordAnalysis
    quality_review: CVQualityReview
    suggestions: List[RevisionSuggestion] = Field(default_factory=list)
    cv_profile: CVProfile
    jd_analysis: JDAnalysis
    warnings: List[str] = Field(default_factory=list)
    scoring_explanation: str


class AnalysisSummary(BaseModel):
    id: str
    timestamp: datetime
    job_title: Optional[str] = None
    candidate_name: Optional[str] = None
    overall_score: int
    total_requirements: int
    matched: int
    partial: int
    not_evidenced: int
    provider: str
    is_demo_mode: bool
