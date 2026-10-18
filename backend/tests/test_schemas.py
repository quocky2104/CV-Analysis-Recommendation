import pytest
from pydantic import ValidationError

from app.schemas.analysis import (
    AnalysisRequest,
    AnalysisResponse,
    CVQualityReview,
    KeywordAnalysis,
    QualityItem,
    RequirementMatch,
    RevisionSuggestion,
    ScoreBreakdown,
)
from app.schemas.common import MatchStatus, Priority
from app.schemas.cv import CVProfile, Education, Project, WorkExperience
from app.schemas.export import CVExportRequest, ReportExportRequest
from app.schemas.jd import JDAnalysis, JDRequirement


def test_enum_validations() -> None:
    assert MatchStatus("match") == MatchStatus.MATCH
    assert MatchStatus("partial_match") == MatchStatus.PARTIAL_MATCH
    assert MatchStatus("not_evidenced") == MatchStatus.NOT_EVIDENCED

    with pytest.raises(ValueError):
        MatchStatus("invalid_status")

    assert Priority("required") == Priority.REQUIRED
    assert Priority("preferred") == Priority.PREFERRED
    assert Priority("nice_to_have") == Priority.NICE_TO_HAVE

    with pytest.raises(ValueError):
        Priority("urgent")


def test_cv_profile_optional_defaults() -> None:
    profile = CVProfile()
    assert profile.name is None
    assert profile.email is None
    assert profile.skills == []
    assert profile.work_experience == []
    assert profile.projects == []
    assert profile.education == []


def test_cv_profile_populated() -> None:
    profile = CVProfile(
        name="Alex Smith",
        email="alex@example.com",
        skills=["Python", "Docker"],
        work_experience=[
            WorkExperience(
                company="Tech Inc",
                title="Engineer",
                responsibilities=["Backend API dev"],
            )
        ],
        projects=[
            Project(name="Project X", technologies=["FastAPI"]),
        ],
        education=[
            Education(institution="State Univ", degree="BS", field="CS"),
        ],
    )
    assert profile.name == "Alex Smith"
    assert len(profile.skills) == 2
    assert profile.work_experience[0].company == "Tech Inc"
    assert profile.projects[0].technologies == ["FastAPI"]


def test_jd_schemas() -> None:
    req = JDRequirement(
        id="REQ-001",
        description="Experience with Python",
        priority=Priority.REQUIRED,
        category="Technical",
    )
    assert req.id == "REQ-001"
    assert req.priority == Priority.REQUIRED

    jd = JDAnalysis(
        job_title="Lead Developer",
        requirements=[req],
    )
    assert jd.job_title == "Lead Developer"
    assert len(jd.requirements) == 1


def test_requirement_match_invalid_enum() -> None:
    with pytest.raises(ValidationError):
        RequirementMatch(
            requirement_id="REQ-01",
            requirement="Python",
            priority="not_a_priority",  # Invalid
            category="Tech",
            status="match",
            reason="Ok",
        )


def test_score_breakdown_bounds() -> None:
    # Valid
    sb = ScoreBreakdown(
        overall_score=85,
        total_requirements=5,
        matched=4,
        partial=1,
        not_evidenced=0,
        required_score=90,
        preferred_score=80,
        nice_to_have_score=70,
        critical_gaps=[],
    )
    assert sb.overall_score == 85

    # Out of bounds (> 100)
    with pytest.raises(ValidationError):
        ScoreBreakdown(
            overall_score=150,
            total_requirements=1,
            matched=1,
            partial=0,
            not_evidenced=0,
            required_score=100,
            preferred_score=0,
            nice_to_have_score=0,
        )


def test_export_requests(sample_analysis_response: AnalysisResponse) -> None:
    rep_req = ReportExportRequest(analysis_data=sample_analysis_response)
    assert rep_req.analysis_data.analysis_id == sample_analysis_response.analysis_id

    cv_req = CVExportRequest(
        cv_profile=sample_analysis_response.cv_profile,
        approved_suggestion_ids=["SUG-001"],
        suggestions=sample_analysis_response.suggestions,
    )
    assert len(cv_req.approved_suggestion_ids) == 1
