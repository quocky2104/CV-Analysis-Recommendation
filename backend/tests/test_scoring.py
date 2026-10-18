from app.schemas.analysis import RequirementMatch
from app.schemas.common import MatchStatus, Priority
from app.services.matcher import calculate_scores, verify_evidence


def test_empty_requirements_scoring() -> None:
    breakdown = calculate_scores([])
    assert breakdown.overall_score == 0
    assert breakdown.total_requirements == 0
    assert breakdown.matched == 0
    assert breakdown.partial == 0
    assert breakdown.not_evidenced == 0
    assert breakdown.critical_gaps == []


def test_all_matched_scoring() -> None:
    matches = [
        RequirementMatch(
            requirement_id="REQ-01",
            requirement="Python programming",
            priority=Priority.REQUIRED,
            category="Technical",
            status=MatchStatus.MATCH,
            reason="Found",
        ),
        RequirementMatch(
            requirement_id="REQ-02",
            requirement="FastAPI experience",
            priority=Priority.PREFERRED,
            category="Technical",
            status=MatchStatus.MATCH,
            reason="Found",
        ),
        RequirementMatch(
            requirement_id="REQ-03",
            requirement="Docker containerization",
            priority=Priority.NICE_TO_HAVE,
            category="Technical",
            status=MatchStatus.MATCH,
            reason="Found",
        ),
    ]

    breakdown = calculate_scores(matches)
    assert breakdown.overall_score == 100
    assert breakdown.total_requirements == 3
    assert breakdown.matched == 3
    assert breakdown.partial == 0
    assert breakdown.not_evidenced == 0
    assert breakdown.required_score == 100
    assert breakdown.preferred_score == 100
    assert breakdown.nice_to_have_score == 100
    assert breakdown.critical_gaps == []


def test_all_not_evidenced_scoring() -> None:
    matches = [
        RequirementMatch(
            requirement_id="REQ-01",
            requirement="5+ years in Rust",
            priority=Priority.REQUIRED,
            category="Technical",
            status=MatchStatus.NOT_EVIDENCED,
            reason="Missing",
        ),
        RequirementMatch(
            requirement_id="REQ-02",
            requirement="Kubernetes CKA",
            priority=Priority.PREFERRED,
            category="Technical",
            status=MatchStatus.NOT_EVIDENCED,
            reason="Missing",
        ),
    ]

    breakdown = calculate_scores(matches)
    assert breakdown.overall_score == 0
    assert breakdown.matched == 0
    assert breakdown.not_evidenced == 2
    assert breakdown.required_score == 0
    assert breakdown.preferred_score == 0
    assert breakdown.critical_gaps == ["5+ years in Rust"]


def test_mixed_scoring_and_weights() -> None:
    # Required weight 3, Preferred weight 2, Nice-to-have weight 1
    # Match: 1.0, Partial: 0.5, Not evidenced: 0.0
    matches = [
        RequirementMatch(
            requirement_id="REQ-01",
            requirement="Python backend",
            priority=Priority.REQUIRED,
            category="Technical",
            status=MatchStatus.MATCH,  # 3 * 1.0 = 3.0
            reason="Evidenced",
        ),
        RequirementMatch(
            requirement_id="REQ-02",
            requirement="System Architecture",
            priority=Priority.REQUIRED,
            category="Technical",
            status=MatchStatus.NOT_EVIDENCED,  # 3 * 0.0 = 0.0
            reason="Missing",
        ),
        RequirementMatch(
            requirement_id="REQ-03",
            requirement="PostgreSQL tuning",
            priority=Priority.PREFERRED,
            category="Technical",
            status=MatchStatus.PARTIAL_MATCH,  # 2 * 0.5 = 1.0
            reason="Partial",
        ),
        RequirementMatch(
            requirement_id="REQ-04",
            requirement="AWS Cloud",
            priority=Priority.NICE_TO_HAVE,
            category="Technical",
            status=MatchStatus.MATCH,  # 1 * 1.0 = 1.0
            reason="Evidenced",
        ),
    ]
    # Total weighted sum: 3.0 + 0.0 + 1.0 + 1.0 = 5.0
    # Max possible weighted sum: 3 + 3 + 2 + 1 = 9.0
    # Expected overall: round(100 * 5.0 / 9.0) = round(55.555...) = 56

    breakdown = calculate_scores(matches)
    assert breakdown.overall_score == 56
    assert breakdown.total_requirements == 4
    assert breakdown.matched == 2
    assert breakdown.partial == 1
    assert breakdown.not_evidenced == 1
    assert breakdown.critical_gaps == ["System Architecture"]
    # Required score: (1.0 + 0.0) / 2 = 50%
    assert breakdown.required_score == 50
    # Preferred score: 0.5 / 1 = 50%
    assert breakdown.preferred_score == 50
    # Nice-to-have score: 1.0 / 1 = 100%
    assert breakdown.nice_to_have_score == 100


def test_verify_evidence() -> None:
    cv_text = """
    Nguyễn Văn B - Senior Backend Engineer
    Experience at Acme Corp:
    - Designed and implemented microservices using FastAPI and MongoDB.
    - Improved database query performance by 45%.
    """

    # Exact match
    assert verify_evidence("Designed and implemented microservices using FastAPI", cv_text)

    # Whitespace and case normalization
    assert verify_evidence("   designed   AND  implemented   microservices   ", cv_text)

    # Substring of long phrase
    assert verify_evidence("Improved database query performance by 45% with indexes", cv_text)

    # Non-matching evidence
    assert not verify_evidence("Built machine learning models in C++", cv_text)

    # Empty inputs
    assert not verify_evidence(None, cv_text)
    assert not verify_evidence("", cv_text)
    assert not verify_evidence("FastAPI", "")
