try:
    from sqlalchemy.orm import Session
except ImportError:
    Session = object  # type: ignore

from app.schemas.analysis import AnalysisResponse
from app.services.history_service import (
    delete_analysis,
    get_analysis,
    list_analyses,
    save_analysis,
)


def test_save_and_get_analysis(
    db_session: Session,
    sample_analysis_response: AnalysisResponse,
) -> None:
    # Save
    record = save_analysis(db_session, sample_analysis_response)
    assert record.id == sample_analysis_response.analysis_id
    assert record.overall_score == sample_analysis_response.scores.overall_score

    # Get
    retrieved = get_analysis(db_session, sample_analysis_response.analysis_id)
    assert retrieved is not None
    assert retrieved.analysis_id == sample_analysis_response.analysis_id
    assert retrieved.job_title == sample_analysis_response.job_title
    assert len(retrieved.requirement_matches) == len(sample_analysis_response.requirement_matches)


def test_list_analyses(
    db_session: Session,
    sample_analysis_response: AnalysisResponse,
) -> None:
    save_analysis(db_session, sample_analysis_response)

    summaries = list_analyses(db_session, skip=0, limit=10)
    assert len(summaries) >= 1
    found = next((s for s in summaries if s.id == sample_analysis_response.analysis_id), None)
    assert found is not None
    assert found.overall_score == sample_analysis_response.scores.overall_score
    assert found.candidate_name == sample_analysis_response.cv_profile.name


def test_delete_analysis(
    db_session: Session,
    sample_analysis_response: AnalysisResponse,
) -> None:
    save_analysis(db_session, sample_analysis_response)

    # Delete existing
    deleted = delete_analysis(db_session, sample_analysis_response.analysis_id)
    assert deleted is True

    # Retrieve again
    retrieved = get_analysis(db_session, sample_analysis_response.analysis_id)
    assert retrieved is None

    # Deleting again should return False
    assert delete_analysis(db_session, sample_analysis_response.analysis_id) is False


def test_get_nonexistent_analysis(db_session: Session) -> None:
    retrieved = get_analysis(db_session, "nonexistent-id-999")
    assert retrieved is None
