import os
import sys
from datetime import datetime, timezone
from typing import Generator
import pytest
try:
    from fastapi.testclient import TestClient
except (ImportError, RuntimeError):
    TestClient = None
try:
    from sqlalchemy import create_engine
    from sqlalchemy.orm import Session, sessionmaker
    from sqlalchemy.pool import StaticPool
    SQLALCHEMY_AVAILABLE = True
except ImportError:
    SQLALCHEMY_AVAILABLE = False
    Session = object  # type: ignore
    create_engine = sessionmaker = StaticPool = None

# Ensure backend root is on Python path
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.database import Base, get_db
from app.main import app
from app.schemas.analysis import (
    AnalysisResponse,
    CVQualityReview,
    KeywordAnalysis,
    QualityItem,
    RequirementMatch,
    RevisionSuggestion,
    ScoreBreakdown,
)
from app.schemas.common import MatchStatus, Priority
from app.schemas.cv import CVProfile, WorkExperience
from app.schemas.jd import JDAnalysis, JDRequirement

if SQLALCHEMY_AVAILABLE and create_engine is not None:
    SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
    test_engine = create_engine(
        SQLALCHEMY_DATABASE_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)
else:
    test_engine = None
    TestingSessionLocal = None


@pytest.fixture(scope="session", autouse=True)
def init_test_db() -> Generator[None, None, None]:
    if SQLALCHEMY_AVAILABLE and test_engine is not None and hasattr(Base, "metadata") and Base.metadata is not None:
        Base.metadata.create_all(bind=test_engine)
        yield
        Base.metadata.drop_all(bind=test_engine)
    else:
        yield


@pytest.fixture
def db_session() -> Generator:
    if SQLALCHEMY_AVAILABLE and test_engine is not None and TestingSessionLocal is not None:
        connection = test_engine.connect()
        transaction = connection.begin()
        session = TestingSessionLocal(bind=connection)

        yield session

        session.close()
        transaction.rollback()
        connection.close()
    else:
        from app.database import InMemorySession
        yield InMemorySession()


@pytest.fixture
def client(db_session: Session) -> Generator:
    if TestClient is None:
        pytest.skip("httpx/starlette TestClient is not installed")
    def override_get_db() -> Generator[Session, None, None]:
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def sample_cv_text() -> str:
    return """
Nguyễn Văn A
Email: nguyenvana@example.com
Phone: +84 987 654 321
GitHub: https://github.com/nguyenvana

SUMMARY
Senior Python Engineer with 5+ years of experience designing scalable REST APIs and microservices.

TECHNICAL SKILLS
Python, FastAPI, Django, Docker, Kubernetes, PostgreSQL, Redis, REST API, Git, CI/CD

WORK EXPERIENCE
Senior Backend Engineer — TechCorp Vietnam
2021 - Present
- Architected high-throughput REST APIs using FastAPI and PostgreSQL handling 50k requests per minute.
- Deployed microservices on Kubernetes and improved system availability to 99.99%.
- Automated CI/CD pipelines using GitHub Actions, reducing deployment time by 40%.

EDUCATION
Bachelor of Science in Computer Science — Hanoi University of Science and Technology
2016 - 2020
"""


@pytest.fixture
def sample_jd_text() -> str:
    return """
Job Title: Senior Backend Engineer (Python)
Seniority: Senior
Industry: Information Technology

Job Requirements:
- At least 4 years of proven experience building backend systems with Python and FastAPI.
- Solid experience with relational databases including PostgreSQL and performance tuning.
- Hands-on experience with Docker, container orchestration, and CI/CD pipelines.
- Good English communication skills for working with international distributed teams.
- Nice to have: Experience with message brokers like Kafka or RabbitMQ.
"""


@pytest.fixture
def sample_analysis_response() -> AnalysisResponse:
    matches = [
        RequirementMatch(
            requirement_id="REQ-001",
            requirement="At least 4 years of Python and FastAPI experience",
            priority=Priority.REQUIRED,
            category="Technical",
            status=MatchStatus.MATCH,
            reason="Candidate has 5+ years with Python and FastAPI",
            evidence="Senior Python Engineer with 5+ years of experience designing scalable REST APIs",
            is_verified_quote=True,
        ),
        RequirementMatch(
            requirement_id="REQ-002",
            requirement="PostgreSQL and performance tuning",
            priority=Priority.REQUIRED,
            category="Technical",
            status=MatchStatus.MATCH,
            reason="High throughput with PostgreSQL",
            evidence="Architected high-throughput REST APIs using FastAPI and PostgreSQL",
            is_verified_quote=True,
        ),
        RequirementMatch(
            requirement_id="REQ-003",
            requirement="Message brokers like Kafka",
            priority=Priority.NICE_TO_HAVE,
            category="Technical",
            status=MatchStatus.NOT_EVIDENCED,
            reason="No direct mention of Kafka",
            evidence=None,
            is_verified_quote=False,
        ),
    ]

    scores = ScoreBreakdown(
        overall_score=86,
        total_requirements=3,
        matched=2,
        partial=0,
        not_evidenced=1,
        required_score=100,
        preferred_score=0,
        nice_to_have_score=0,
        critical_gaps=[],
    )

    quality = CVQualityReview(
        clarity=QualityItem(score=4.5, reason="Clear structure", examples=["Good headings"]),
        relevance=QualityItem(score=4.0, reason="Strong alignment with JD", examples=[]),
        impact_evidence=QualityItem(score=4.0, reason="Clear metrics provided", examples=["50k req/min"]),
        structure=QualityItem(score=4.5, reason="Standard chronological format", examples=[]),
        overall_quality_score=4.3,
    )

    suggestions = [
        RevisionSuggestion(
            id="SUG-001",
            section="Skills",
            original_text=None,
            proposed_text="Add experience with Kafka message queues if applicable.",
            reason="JD mentions Kafka as nice-to-have",
            related_requirement_ids=["REQ-003"],
            priority="low",
        )
    ]

    return AnalysisResponse(
        analysis_id="test-analysis-12345",
        timestamp=datetime.now(timezone.utc),
        job_title="Senior Backend Engineer (Python)",
        provider="mock",
        is_demo_mode=True,
        scores=scores,
        requirement_matches=matches,
        strengths=["Strong Python and FastAPI foundation", "Proven PostgreSQL scaling"],
        gaps=["No experience with Kafka noted"],
        keyword_analysis=KeywordAnalysis(
            found_in_cv=["Python", "FastAPI", "PostgreSQL"],
            missing_from_cv=[],
            terminology_equivalents=[],
        ),
        quality_review=quality,
        suggestions=suggestions,
        cv_profile=CVProfile(
            name="Nguyễn Văn A",
            email="nguyenvana@example.com",
            phone="+84 987 654 321",
            skills=["Python", "FastAPI", "PostgreSQL"],
            work_experience=[
                WorkExperience(
                    company="TechCorp Vietnam",
                    title="Senior Backend Engineer",
                    dates="2021 - Present",
                    responsibilities=["Architected REST APIs"],
                    achievements=["50k requests per minute"],
                )
            ],
        ),
        jd_analysis=JDAnalysis(
            job_title="Senior Backend Engineer (Python)",
            seniority="Senior",
            industry="Information Technology",
            requirements=[
                JDRequirement(
                    id="REQ-001",
                    description="At least 4 years of Python and FastAPI experience",
                    priority=Priority.REQUIRED,
                    category="Technical",
                )
            ],
        ),
        warnings=[],
        scoring_explanation="Deterministic scoring computed using priority weights.",
    )
